# Code review e piano di correzione — LVGL Visual Editor

*Revisione del codice su `main` @ `e7652de` (v3.0.0, "LVGL 9.3"). Data: 26 ottobre 2026.*

## 1. Versioni di riferimento (ottobre 2026)

| Componente | Ultima versione | Note rilevanti per l'editor |
|---|---|---|
| **LVGL (C)** | **9.6.0**, del 16 set 2026 | È l'ultima release della serie v9. In v10 spariscono tutti i simboli `LV_DEPRECATED` e gli alias `lv_api_map_*.h`. Gli header pubblici ora stanno in `include/lvgl/`. |
| LVGL 9.5 / 9.4 | supportate fino a feb 2027 / ott 2026 | La 9.3 non è più supportata (fine supporto giugno 2026). |
| **MicroPython upstream** | **1.29.0**, del 24 ago 2026 | La 1.30 è in preview. |
| **Binding LVGL per MicroPython** (`lvgl/lv_micropython`) | MicroPython **1.24.1** + LVGL **9.3.0** (binding aggiornato il 6 set 2026) | **È il vero target del generatore MicroPython.** Chi esegue il codice generato usa questo firmware, non LVGL 9.6. |
| CPython | 3.15, ottobre 2026 | Serve solo per il tooling: script di validazione e `scripts/LVGLImage.py` di LVGL per convertire le immagini. |

Conseguenze pratiche:

- **Target C:** API di LVGL 9.6 senza alias deprecati, così il codice compila anche con `LV_DISABLE_API_MAPPING` ed è pronto per v10.
- **Target MicroPython:** API *esatte* di LVGL 9.3.0 come esposte dal binding. Il binding si genera con `gcc -E` e pycparser (`gen/gen_mpy.py`), quindi **gli alias `#define` non diventano metodi Python**. Un nome deprecato che in C compila ancora, in MicroPython dà `AttributeError`.
- Il codice MicroPython generato deve funzionare anche su MicroPython 1.24, quindi niente sintassi recente come le t-string della 1.28.

## 2. Metodo e stato attuale

Cosa ho fatto:

- Letto i generatori, i template, lo store, il main e il preload di Electron e i moduli della v2.0.
- Fatto revisionare il layer React (Canvas, WidgetRenderer, pannelli) da un secondo revisore e ricontrollato a campione i suoi risultati.
- Eseguito i generatori reali (con Handlebars) su un progetto di prova.
- Eseguito uno script sullo store Zustand per riprodurre i bug di stato.
- Confrontato ogni chiamata API generata con gli header di **LVGL 9.6.0** e di **LVGL 9.3.0**, quest'ultimo nella versione inclusa nel binding MicroPython.

| Controllo | Esito |
|---|---|
| `vite build` | ✅ passa |
| `npm run lint` | ❌ fallisce: 6 errori (`react/no-unescaped-entities`) e 30 warning, con `--max-warnings 0` |
| Test automatici | ❌ assenti |
| Il codice generato compila o gira | ❌ no: vedi P0-1, P0-4, P0-5, P0-6 e P0-7 |

Severità: **P0** = output sbagliato, perdita di dati o falla di sicurezza. **P1** = funzionalità rotta. **P2** = qualità e compatibilità futura. **P3** = tooling e manutenzione.

---

## 3. Problemi P0 — critici

### P0-1 · Handlebars fa l'escape HTML del codice degli eventi
`{{this.code}}` usa le doppie graffe, quindi Handlebars converte `=`, `>`, `<`, `"` e `&` in entità HTML. Ogni handler scritto dall'utente si rompe. Output reale:
```c
if (count &gt; 0) { count &#x3D; 0; }
```
- **Dove:** tutti e 12 i template `.hbs` (per esempio `templates/unix/c_template.hbs:56` e `templates/stm32/micropython_template.hbs:24`) e i template di default in `src/generators/templateLoader.js:60,92,151,233`. Anche `{{projectName}}` produce `Demo &amp; Co`.
- **Fix:** usare `{{{this.code}}}`, oppure meglio `Handlebars.compile(src, { noEscape: true })`, visto che l'output è codice e non HTML. Aggiungere un helper `indent` per reindentare il codice su più righe: in Python oggi la seconda riga finisce a colonna 0 e dà `IndentationError`.

### P0-2 · Salvataggio ed export perdono le modifiche della pagina corrente
`getProjectData()` (`src/core/store.js:522`) legge `const state = get()` *prima* di chiamare `savePageWidgets()` e poi restituisce `state.pages`, cioè il vecchio snapshot. L'ho riprodotto: con 1 widget nello store, la pagina esportata ne contiene 0.
- **Impatto:** Save (`Toolbar.jsx:47,55`), Export Code (`CodeExportModal.jsx:14`) e Cloud Save (`CloudSync.jsx:58`) salvano lo stato dell'ultimo cambio pagina. Su un progetto nuovo salvano una pagina vuota.
- **Fix:** dopo `savePageWidgets()` restituire i dati presi da `get()`. Meglio ancora, eliminare la doppia fonte di verità `widgets` + `pages[i].widgets` e tenere solo `pages`, con selettori sulla pagina corrente.

### P0-3 · Sicurezza: scrittura di file arbitrari ed esecuzione di codice remoto
1. **`src/main/main.js:330-353`:** gli IPC `read-file` e `write-file` fanno `path.join(app.getAppPath(), filePath)` senza validare il percorso. Il renderer può leggere o scrivere qualsiasi file con `../../`, per esempio `~/.bashrc`.
2. **`src/core/pluginSystem.js:214`:** `new Function(code)` esegue codice scaricato da URL o incollato dall'utente nel renderer, e la CSP di produzione permette `'unsafe-eval'` (`main.js:48`). Un plugin può quindi chiamare `window.electronAPI.writeFile(...)` e scrivere ovunque sul disco. Le due falle insieme permettono di eseguire codice sulla macchina.
3. Anche senza attaccanti, `write-file` scrive dentro `app.getAppPath()`, che nell'app pacchettizzata (asar) è in sola lettura: salvare i template personalizzati fallirebbe.
- **Fix:**
  - Sostituire `read-file`/`write-file` con API mirate, `getTemplate(arch, name)` e `saveTemplate(arch, name)`, con whitelist dei nomi, salvataggio in `app.getPath('userData')/templates` e controllo che il percorso risolto resti nella cartella.
  - Togliere `'unsafe-eval'` e `'unsafe-inline'` dalla CSP di produzione.
  - Disattivare il caricamento dei plugin finché non esiste una sandbox (P1-9).
  - Aggiungere `sandbox: true`, `setWindowOpenHandler` e un blocco su `will-navigate`.

### P0-4 · Il codice MicroPython chiama API inesistenti nel binding (LVGL 9.3)
Il target MicroPython è ora quello di default (commit `bc1fb96`). I nomi qui sotto in LVGL 9.3.0 sono solo alias `#define`, oppure non esistono affatto, quindi danno `AttributeError` a runtime:

| Generato (`micropythonGenerator.js`) | Riga | Quando | Nome corretto in 9.3 |
|---|---|---|---|
| `anim.set_time()` | 111 | **ogni animazione** | `set_duration()` |
| `anim.set_playback_time()` | 119 | playback | `set_reverse_duration()` |
| `chart.set_range(...)` | 401 | **ogni chart** | `set_axis_range(...)` |
| `spangroup.new_span()` / `.refr_mode()` | 649, 654 | **ogni span** | `add_span()` / `refresh()` |
| `span.style.set_text_color(...)` | 651 | ogni span | `span.get_style().set_text_color(...)` |
| `calendar.set_showed_date()` | 614 | **ogni calendar** | `set_month_shown()` |
| `lv.calendar_header_arrow(cal)` | 616 | showHeader | `cal.add_header_arrow()` |
| `slider.set_left_value()` | 208 | range slider | `set_start_value()` |
| `lv.LABEL_LONG.*` | 184-186 | longMode | `lv.LABEL_LONG_MODE.*` (es. `DOTS`, non `DOT`) |
| `spinbox.set_digit_count()` / `set_separator_position()` | 292-293 | se impostati | `set_digit_format(count, sep_pos)`; `set_separator_position` non è mai esistito |

- **Fix:** un profilo API per target (vedi il piano, fase 1), con test che verificano ogni nome emesso sulla lista dei simboli esportati dal binding.

### P0-5 · Il codice C non compila o ha comportamento indefinito su LVGL 9.3+/9.6
- `lv_spinbox_set_separator_position` (`cGenerator.js:286`) non esiste in nessuna versione, e `lv_spinbox_set_digit_count` (`:285`) non esiste in 9.3.
- `&span->style` (`cGenerator.js:654-655`): dalla 9.3 `lv_span_t` è opaco, perché la struct è definita in `lv_span_private.h`. Va usato `lv_span_get_style(span)`.
- Fade (`cGenerator.js:139`): `(lv_anim_exec_xcb_t)lv_obj_set_style_opa` converte una funzione con 3 argomenti in una callback con 2. Il selettore riceve memoria casuale: è comportamento indefinito. Serve un wrapper `static void anim_opa_cb(void *o, int32_t v){ lv_obj_set_style_opa(o, v, 0); }`.
- `lv_image_set_src(img, &<nome_asset>)` (`:462`): il generatore non dichiara il simbolo (`LV_IMAGE_DECLARE`) e non produce i dati dell'immagine, quindi il link fallisce. L'Asset Manager salva solo data-URL che nessun generatore usa.

### P0-6 · Gli identificatori generati possono essere invalidi o in conflitto
`sanitizeIdentifier` (`cGenerator.js:20`, `micropythonGenerator.js:20`) si limita a sostituire i caratteri non validi. Effetti verificati:
- Un progetto chiamato "1 My Project" genera `void 1_my_project_init(void)`, che non è valido né in C né in Python.
- Due pagine "Main" generano **due funzioni con lo stesso nome**.
- Con lo stesso `callback` su due eventi diversi, il C ha una ridefinizione (errore di compilazione) e in Python la seconda `def` cancella la prima, perdendo l'handler di CLICKED.
- `Button 1` e `button_1` collidono, e così due copie da Duplicate (`X_copy`).
- I nomi riservati (`lambda`, `class`, `int`, `list`...) danno errori di sintassi o oscurano builtin.
- **Fix:** un allocatore di identificatori per progetto: prefisso se il nome inizia con una cifra, blacklist delle parole riservate C e Python, suffisso `_2`, `_3` sulle collisioni. Raggruppare gli handler per nome della callback e generare un solo handler con uno `switch` o `if` sul codice dell'evento.

### P0-7 · Le stringhe non vengono escapate
`set_text("${props.text}")` e simili, in tutti i widget di entrambi i generatori. Con `Say "hi"` si ottiene `lv_label_set_text(label_c, "Say "hi"");`, un errore di sintassi, e il problema vale anche per newline e backslash. Gli stessi campi (`options`, `items`, `headerRow`, `map`, `spans`...) permettono anche di iniettare codice nell'output.
- **Fix:** helper `cString()` e `pyString()` usati da *ogni* letterale, più un test di fuzzing con stringhe ostili.

### P0-8 · Ordine di creazione dei widget annidati
L'ordinamento in `cGenerator.js:713,780` e `micropythonGenerator.js:702,773` mette solo le radici prima dei figli. Un nipote che nell'array viene prima del suo genitore produce `lv_label_create(panel_b)` prima che `panel_b` esista: errore di compilazione in C, `NameError` in Python. È verificato col primo generatore e la logica attuale è identica.
- **Fix:** ordinamento topologico (DFS dalle radici), con rilevamento di cicli e di `parentId` orfani.

---

## 4. Problemi P1 — funzionalità rotte

**Store e modello dati** (riprodotti con lo script sullo store, salvo dove indicato):

- **P1-1 · `addPage`** (`store.js:236`): passa alla nuova pagina senza salvare la corrente e senza svuotare i widget. I widget della pagina 1 compaiono sulla nuova pagina e finiscono salvati anche lì.
- **P1-2 · Rinomina widget** (`PropertiesPanel.jsx:129`): `updateWidget(id, {name})` scrive `props.name`, e `widget.name` non cambia mai. Serve un'azione `renameWidget`.
- **P1-3 · Gerarchia incoerente:**
  - `deleteWidget` lascia figli orfani, che poi spariscono dall'albero (`HierarchyPanel.jsx:11`).
  - `duplicateWidget` non copia i figli e duplica gli id di eventi e animazioni.
  - `duplicatePage` rigenera gli id senza rimappare `parentId`, rompendo la gerarchia della copia.
  - `insertComponent` crea N voci di history e aggiunge un offset extra di `index*5` px (`ComponentLibrary.jsx:48-57`; dal secondo revisore, non riprodotto).
- **P1-4 · Coordinate dei figli** (`Canvas.jsx`, `WidgetRenderer.jsx`; dal secondo revisore, poi verificato nel codice): il canvas disegna i figli in coordinate assolute, mentre LVGL posiziona i figli rispetto al content area del genitore. L'anteprima e il dispositivo quindi non coincidono, e trascinare un pannello non sposta i suoi figli.
- **P1-5 · History:**
  - Ogni tasto o movimento del color picker salva uno snapshot completo, quindi 50 caratteri esauriscono la history.
  - Undo e redo non tengono conto della pagina: un undo dopo un cambio pagina ripristina i widget di un'altra pagina.
  - `moveWidgetToFront` e `moveWidgetToBack` non entrano nella history.

**Generatori:**

- **P1-6 · Valori 0 ignorati:** `props.value || 50`, `max || 100` e simili (es. `cGenerator.js:199`, `micropythonGenerator.js:202`). Uno slider a 0 esce a 50. Usare `??`.
- **P1-7 · Stili e font:**
  - `customStyles`, impostati dallo StyleEditor, non vengono mai letti né dai generatori né dal canvas.
  - `lv_font_montserrat_${size}` compila solo se il font è abilitato in `lv_conf.h`, ed esistono solo le taglie pari da 8 a 48.
  - Il generatore MicroPython ignora `fontSize`.
  - `colorToLvglHex` (`cGenerator.js:15`) con `#FFF` produce `0xFFF`, cioè un colore sbagliato.

**Electron e UI** (dal secondo revisore, ricontrollati a campione):

- **P1-8:**
  - `prompt()` in `PageManager.jsx:21` non è supportato da Electron, quindi "Add page" non fa nulla nell'app.
  - Cliccare il canvas vuoto non deseleziona, perché il `Rect` di sfondo intercetta il click (`Canvas.jsx:50,136`).
  - I comandi da menu sono registrati con dipendenze `[]` (`Toolbar.jsx:153`): lo zoom da menu usa sempre il valore iniziale, e senza unsubscribe in StrictMode ogni comando, Undo compreso, gira due volte.

**Funzionalità della v2.0** (implementate da me in questa sessione, quindi questa parte è autocritica):

- **P1-9 · Sono in gran parte solo scaffolding, ma il README le presenta come complete:**
  - Gli hook dei plugin (`executeHook`) e i widget e generatori dei plugin non sono mai collegati all'editor.
  - Il collaborative editing simula il socket (`collaboration.js:46`) e non trasmette nessuna modifica.
  - L'auto-sync non fa nulla (`cloudSync.js:205`).
  - Il "cloud" è il `localStorage`, e la CSP di produzione (`connect-src 'self'`) bloccherebbe comunque qualsiasi backend esterno o plugin da URL.
  - Gli stili CSS globali (`.btn-primary`, `.form-group`, `.dialog-actions`...) collidono tra loro e i pulsanti flottanti coprono la sidebar e la status bar.
  - **Decisione da prendere:** implementarle davvero (fase 4) oppure marcarle *experimental* dietro un flag e correggere il README.
- **P1-10 · Architetture senza template:** RP2040 e nRF52 compaiono nell'elenco (`templateLoader.js:13-14`) ma non hanno template, quindi si ricade su quelli di default senza avviso. Lo stesso succede nel browser, sempre. Le varianti per architettura cambiano solo commenti e include e non inizializzano display o input.

## 5. Problemi P2 — qualità e compatibilità futura

- **Nomi deprecati nel C:** compilano su 9.6 solo grazie agli alias, e si rompono con `LV_DISABLE_API_MAPPING` e su v10.
  - `lv_anim_set_time` / `lv_anim_set_playback_time` (`cGenerator.js:98,106`)
  - `lv_slider_set_left_value` (`:205`)
  - `lv_chart_set_range` (`:388`)
  - `lv_calendar_set_showed_date` e `lv_calendar_header_arrow_create` (`:612,614`)
  - `lv_spangroup_new_span` e `lv_spangroup_refr_mode` (`:652,658`)
  - `LV_LABEL_LONG_WRAP` come valore di default in `widgetDefinitions.js:89`
- **Scale:** `total_tick_count` vale NaN se `majorTickEvery` è 0 e può essere frazionario in C (`cGenerator.js:449`).
- **Msgbox:** l'array `static const char *_btns[]` è inutilizzato, residuo dell'API v8 (`cGenerator.js:568-569`).
- **Widget irraggiungibili:** i widget sono variabili locali alla funzione `create`, quindi il codice applicativo non può raggiungerli. Generare una struct `ui_t` (C) o un namespace o dict `ui.objects` (Python), come fanno SquareLine ed EEZ Studio.
- **Output non deterministico:** il timestamp `Generated:` cambia a ogni export e sporca le diff. Renderlo opzionale.
- **CodeExportModal:**
  - `useMemo(() => getProjectData(), [])` causa un update dello store durante il render.
  - La generazione asincrona non viene annullata quando si cambia lingua o architettura.
- **Performance:**
  - `useStore()` senza selettori fa ri-renderizzare tutti i pannelli a ogni drag.
  - CloudSync e Collaboration fanno polling ogni secondo con `setInterval`.
- **Anteprima:** `WidgetRenderer` divide per `max - min` senza controllo (NaN/Infinity), e l'arc ignora gli angoli.
- **Template STM32 MicroPython** (commit `e7652de`): chiama `{{baseName}}_load_page(1)` fuori dai commenti, quindi con 2 o più pagine l'app parte sulla seconda. Se serviva solo per il test, va riportato nell'esempio commentato.

## 6. Problemi P3 — tooling e dipendenze

- **`.gitignore`:** è il template per progetti C e **non esclude `node_modules/` né `dist/`**. Basta un `git add .` per committare centinaia di MB.
- **Lint e test:** il lint fallisce e non esistono test né CI.
- **Dipendenze datate**, con le versioni npm correnti tra parentesi:
  - Electron 28, fuori supporto (45)
  - `electron-forge` 5, deprecato (`@electron-forge/cli` 8)
  - ESLint 8, fuori supporto (10, flat config)
  - Vite 5 (8)
  - React 18 (19)
  - Zustand 4 (5)
  - konva/react-konva (10/19)
  - lucide-react 0.294 (1.x)
  - `electron.vite.config.js` non è usato e `electron-vite` non è tra le dipendenze.
- **Due README** (`README.md` e `README_ITA.md`) che tendono a divergere.

---

## 7. Piano di intervento

### Fase 0 — Hotfix e rete di sicurezza (2–3 giorni)
1. `.gitignore`: aggiungere `node_modules/`, `dist/`, `out/`, `*.log` e `.env*`.
2. **P0-2:** sistemare `getProjectData` e `addPage`. **P0-1:** `noEscape` con helper `indent`.
3. **P0-3:** chiudere `read-file`/`write-file` (whitelist e `userData`), disattivare il caricamento dei plugin e togliere `unsafe-eval` dalla CSP.
4. Correggere i 6 errori di lint.
5. Introdurre **Vitest** con i primi test di regressione: store (i casi riprodotti in questa review) e generatori (snapshot di un progetto di riferimento).

#### Stato della fase 0: completata
- `.gitignore` esclude ora `node_modules/`, `dist/`, `out/`, `coverage/`, log e `.env*`. Aggiunto `package-lock.json`.
- **P0-2:** `getProjectData` legge lo stato *dopo* `savePageWidgets()`. `addPage` salva la pagina corrente e parte vuota. `loadProject` carica i widget della pagina corrente salvata, non sempre della prima.
- **P0-1:** template compilati con `noEscape` e helper `{{indent this.code 8}}` in tutti i 12 `.hbs` e nei template di default. Nei template MicroPython è stato aggiunto `pass` dopo il codice dell'evento, così anche un handler vuoto o fatto solo di commenti è Python valido.
- **P0-3:**
  - IPC `read-file`/`write-file` sostituiti da `read-template`/`write-template` (`src/main/templateStore.js`), con whitelist di architetture e nomi, controllo del percorso e limite di 1 MiB. I template personalizzati vanno in `userData`.
  - Caricamento di plugin esterni disattivato (`EXTERNAL_PLUGINS_ENABLED = false`).
  - `sandbox: true`, `setWindowOpenHandler` e blocco di `will-navigate`.
  - CSP di produzione senza `'unsafe-inline'` per gli script, applicata anche come `<meta>` nella build (con `file://` gli header di `onHeadersReceived` non valgono).
- **Lint:** `npm run lint` passa con 0 errori e 0 warning.
- **Test:** Vitest 2 con `npm test`, 44 test.
  - Store: i 5 casi di P0-2.
  - Generatori: niente escape HTML e sintassi Python valida (verificata con `python3 -c ast.parse`) per unix, stm32 ed esp32, sia con i template di default sia con i file `.hbs`, più gli snapshot del progetto di riferimento.
  - `templateStore`: tentativi di path traversal.
  - Ho verificato che questi test **falliscono** sul codice precedente.

**Deviazioni dal piano:**
- `'unsafe-eval'` resta nella CSP, perché `Handlebars.compile()` lo richiede per i template a runtime. Si toglierà precompilando i template (fase 1). Il rischio principale, l'`eval` dei plugin, è comunque eliminato.
- Le modifiche al processo Electron (`sandbox`, handler di navigazione, IPC) sono verificate solo con `node --check` e con i test di `templateStore`: l'app Electron non è stata avviata, perché questo ambiente non ha un display.
- Gli snapshot fissano l'output *attuale*, compresi i nomi API sbagliati di P0-4 e P0-5: sono una base di regressione e andranno aggiornati in fase 1.

### Fase 1 — Nuovo nucleo dei generatori (1–2 settimane)
Obiettivo: il codice generato **compila e gira**, verificato in CI.

1. **Rappresentazione intermedia (IR):** il progetto viene normalizzato in un albero ordinato con identificatori univoci, stringhe già escapate e handler raggruppati. Così si risolvono P0-6, P0-7 e P0-8 in un unico punto, condiviso da C e Python.
2. **Profili API per target**, in un modulo dati e non sparsi nel codice:
   - `c-lvgl-9.6`: nomi 9.6 senza alias, compatibili con v10.
   - `mpy-lvgl-9.3`: nomi esatti del binding.
   - In futuro `mpy-lvgl-9.6`, quando il binding verrà aggiornato.
   - Ogni widget emette chiamate astratte (es. `anim.duration`), che il profilo traduce nei nomi concreti. Il profilo si sceglie nel dialog di export.
3. **Correzioni puntuali:** P0-4, P0-5, P1-6, colori `#RGB`, fade tramite wrapper o `set_custom_exec_cb`, spinbox con `set_digit_format`, span con `get_style()`.
4. **Font:** mappare `fontSize` sulla taglia Montserrat pari più vicina e generare un commento con i `LV_FONT_MONTSERRAT_xx` da abilitare in `lv_conf.h`. Supportare `fontSize` anche in MicroPython (`lv.font_montserrat_16`).
5. **`customStyles`:** applicarli in entrambi i generatori e nell'anteprima del canvas.
6. **Handle ai widget:** `ui_t` in C (con un header `ui.h` generato) e `ui.objects` in Python.
7. **CI di validazione:**
   - **C:** compilare l'output con `gcc -fsyntax-only -DLV_DISABLE_API_MAPPING` sugli header di LVGL 9.6.0, con un `lv_conf.h` di test, su una matrice di progetti di prova (tutti i 30 widget, nesting profondo, stringhe ostili).
   - **MicroPython:** compilare il port unix di `lv_micropython` (MicroPython 1.24.1 + LVGL 9.3) ed eseguire l'output in modalità headless; basta che `import` e `*_init()` non diano eccezioni.
   - **Simboli:** script Python 3.15 che estrae dal binding i simboli esportati e fallisce se il profilo `mpy-lvgl-9.3` usa nomi inesistenti.

#### Stato della fase 1: completata
_Aggiornamento: rimosso il supporto ai dati dei formati precedenti (formato v1.1 senza pagine nello store, valori `LV_LABEL_LONG_*` pre-9.1, campi dei template a un solo evento), mai usati. Un file senza pagine ora viene rifiutato con un messaggio. Rimosso anche il ramo "pagina singola" del generatore, con i 6 template `c_template.hbs`/`micropython_template.hbs`: ogni progetto ha almeno una pagina e usa i template multipagina, poi rinominati `c_template.hbs`/`micropython_template.hbs` (nomi `c`/`micropython`)._

**Nuovo nucleo** in `src/generators/core/`:
- `identifiers.js`: identificatori univoci per tutto il progetto, validi in C e Python, mai uguali a parole riservate, builtin, simboli `lv_` o nomi usati dai template.
- `values.js`: numeri, colori (anche `#RGB`), enum, font e stringhe validati. Un valore non valido fa saltare la chiamata, non finisce nel codice.
- `widgets.js`: i 30 widget descritti una sola volta come operazioni con nomi di funzione C.
- `emit.js`: due emitter. Il Python ricava metodo, classe ed enum dal nome C con le stesse regole del binding (`lv_slider_set_range` → `slider.set_range`, `LV_LABEL_LONG_MODE_DOTS` → `lv.label.LONG_MODE.DOTS`).
- `project.js`: ordinamento topologico (cicli e genitori mancanti diventano radici) e handler raggruppati per nome, con un ramo per evento. Se lo stesso nome ha codice diverso per lo stesso evento, nasce un secondo handler.

`cGenerator.js` e `micropythonGenerator.js` ora sono solo involucri sottili.

**Bug risolti:**
- Tutti i P0 dei generatori: P0-4, P0-5, P0-6, P0-7 e P0-8.
- P1-6 (i valori 0 non vengono più sostituiti) e P1-7 (stili e font).
- Ordine di creazione dei figli.
- Semantica dei tick dello `scale`.
- Array inutile del `msgbox`.

**Font:**
- C: taglia Montserrat pari più vicina, con commento su cosa abilitare in `lv_conf.h`.
- MicroPython: 14, 16 o 24, le uniche presenti nel firmware di default.

**Stili e handle:**
- I `customStyles` sono applicati nei generatori e nell'anteprima del canvas (`src/core/previewProps.js`).
- I widget sono raggiungibili come `ui_<nome>` in C e `objects["<nome>"]` in MicroPython.

**Riferimenti API** (`scripts/lvgl-api/`, script Python), in `tests/fixtures/`:
- simboli C di LVGL 9.6 senza alias, più l'elenco delle funzioni `LV_DEPRECATED`;
- API MicroPython presa dai metadati della **build reale** del firmware lv_micropython.

**Test:** 84 in tutto, di cui 75 sempre attivi e 9 che richiedono gli strumenti reali.
- Ogni simbolo C deve esistere in 9.6 e non essere deprecato.
- Ogni classe, metodo, enum e funzione Python deve esistere nel firmware, verificando anche la classe del destinatario di ogni chiamata.
- Sintassi Python valida, unicità dei nomi, genitori creati prima dei figli.
- Progetti di prova: tutti i 30 widget, più un progetto "ostile" con nomi in conflitto, stringhe con `"`, `\`, `*/`, `"""` e `??=`, cicli di parentela e valori non validi.

**CI** (`.github/workflows/ci.yml`):
- Lint, test e build.
- Un job che compila il C generato con `gcc -DLV_DISABLE_API_MAPPING -Werror=deprecated-declarations` sugli header di LVGL 9.6.
- Lo stesso job compila il firmware lv_micropython (unix, variante `lvgl`) ed **esegue** il Python generato con un display virtuale: tutte le pagine, animazioni ed eventi, con `gc.collect()` a ogni tick.
- In locale tutti questi test passano. Il workflow non è ancora girato su GitHub, ma i passi di build del firmware sono stati riprodotti in locale.

**Scoperte emerse dagli strumenti reali**, che correggono la sezione 1:
- Il firmware lv_micropython **non esporta `lv.spinner` né `lv.list`**, anche se `lv_conf.h` li abilita, perché il binding preprocessa solo `lvgl_private.h`. In MicroPython lo spinner ora è un arc ruotato da un'animazione infinita.
- LVGL 9.6 **depreca** `lv_list`, `lv_win` e `lv_menu`. Il generatore li costruisce in entrambi i linguaggi con widget base in colonna flex, come raccomanda LVGL. **Cambio di comportamento:** il menu non è più navigabile con sidebar, è un titolo con una colonna di voci.
- LVGL 9.6 depreca anche:
  - `lv_obj_add_flag`/`lv_obj_remove_flag`: in C si usano `lv_obj_set_hidden`/`lv_obj_set_clickable`, in MicroPython 9.3 restano i flag;
  - `lv_spangroup_set_mode`: in C la modalità dello span si ottiene con la dimensione (`LV_SIZE_CONTENT`).
- Di conseguenza il C generato richiede LVGL 9.6. Non è più garantito che compili su 9.3, perché `lv_obj_set_hidden` non esiste in 9.3.

**Deviazioni dal piano:**
- Nessuna tabella di "profili" né scelta del profilo nel dialog: ogni linguaggio ha un solo target. Le differenze sono rami espliciti nei builder (`b.isC`), verificati dai test.
- Niente struct `ui_t` né header `ui.h`: l'export è un file solo. Il C dichiara globali `ui_<nome>` da usare con `extern`.
- `'unsafe-eval'` resta nella CSP: i template personalizzabili sono ancora compilati a runtime.
- Il timestamp `Generated:` è ancora presente (P2).
- I tipi di animazione `scale`, `rotate`, `move_xy` e `size` dell'editor non sono supportati: nel codice generato compare un commento.

### Fase 2 — Modello dati e store (1 settimana)
1. Una sola fonte di verità, `pages[]`, con selettori sulla pagina corrente. Aggiungere `renameWidget`, cancellazione a cascata, duplicazione con rimappatura completa degli id e conversione delle coordinate quando si cambia genitore.
2. History per pagina con raggruppamento delle modifiche: commit su blur o fine drag e debounce sui campi.
3. Validazione del file di progetto al caricamento, così i tipi sconosciuti non mandano più in crash la UI (`definition.icon` su `undefined`). **Nessuna migrazione:** i formati precedenti non sono mai stati usati, quindi è supportato solo il formato attuale.
4. Canvas gerarchico, con i figli annidati nel `Group` del genitore e coordinate relative come in LVGL. Selettori Zustand con `shallow`.

### Fase 3 — Electron e piattaforma (1 settimana)
1. Aggiornare a Electron 45 con `@electron-forge/cli` 8 (oppure electron-builder), `sandbox: true`, CSP restrittiva e niente `prompt()`/`alert()` bloccanti: usare modali o toast.
2. Aggiornare Vite 8, React 19, Zustand 5, konva 10/react-konva 19, lucide-react 1.x ed ESLint 10 con flat config. Togliere `electron.vite.config.js`.
3. Template personalizzati in `userData`, con un editor nell'app e "Ripristina default".
4. **Pipeline degli asset:**
   - **Immagini:** convertirle all'export con `scripts/LVGLImage.py` di LVGL 9.6 (Python 3) in `.c` con `LV_IMAGE_DECLARE` per il target C, oppure in `.bin` o un percorso `"A:..."` per MicroPython.
   - **Font:** generarli con `lv_font_conv`.

### Fase 4 — Funzionalità v2.0 fatte davvero, o rimosse (2–4 settimane, da decidere)
| Funzione | Proposta |
|---|---|
| Collaborazione | CRDT con **Yjs** e `y-websocket` sullo store. Server minimale incluso, awareness per cursori e selezione. |
| Plugin | Esecuzione in iframe o worker in sandbox con API via `postMessage`, manifest con permessi espliciti, nessun accesso a `electronAPI`. Collegare davvero hook, widget e generatori. |
| Cloud sync | Interfaccia provider già pronta. Implementare un provider reale (es. cartella sincronizzata o backend REST con OAuth), aprire nella CSP solo gli host configurati e far funzionare l'auto-sync con lo store. |
| Component library | Libreria **globale** in `userData`, non per progetto. Validazione e re-id all'import, inserimento con una sola voce di history. |

In alternativa, flag *experimental* disattivato di default e README corretto. **Consiglio di correggere il README in ogni caso**, perché oggi descrive funzioni che non esistono.

### Fase 5 — Allineamento a LVGL 9.6 e preparazione a v10 (continuativa)
1. Generare la **data binding** con `lv_subject_t`, `lv_obj_bind_*` e `lv_label_bind_text` (observer, presenti in 9.6 in `core/lv_observer.h`), così i widget si legano a variabili applicative senza scrivere handler a mano. **Attenzione:** in 9.6 sono deprecati `lv_subject_init_*` e `lv_obj_bind_flag_if_*`/`lv_obj_bind_state_if_*` (vedi `deprecated` in `tests/fixtures/lvgl-c-symbols.json`), quindi prima va individuata l'API che li sostituisce.
2. Interoperabilità con l'editor ufficiale di LVGL: negli header pubblici di 9.6.0 non c'è un'API XML, quindi prima di pianificare un import/export va verificato dove si trova oggi quel formato.
3. Quando `lv_micropython` passerà a LVGL ≥ 9.5 o 9.6 e a MicroPython ≥ 1.27, attivare il profilo `mpy-lvgl-9.6`: grazie alla fase 1 servirà solo aggiungere dati.
4. Tenere attivo in CI il job "C con `LV_DISABLE_API_MAPPING`", che dà la garanzia di compatibilità con v10.

### Ordine consigliato
Fase 0 → Fase 1 → Fase 2 → Fase 3, con Fase 4 e Fase 5 in parallelo o successive. I P0 vanno chiusi prima di qualunque nuova funzionalità.

---

## Fonti
- [LVGL v9.6: The Stability Release](https://lvgl.io/blog/release-v9-6) · [LVGL releases (GitHub)](https://github.com/lvgl/lvgl/releases) · [Migrating from v9.5 to v9.6](https://lvgl.io/docs/open/changelog/migration-v9-6) · [LVGL policies (supporto versioni)](https://lvgl.io/docs/open/introduction/policies) · [LVGL v9.5 release](https://lvgl.io/blog/release-v9-5)
- [MicroPython releases (GitHub)](https://github.com/micropython/micropython/releases) · [MicroPython v1.28.0 released (Adafruit)](https://blog.adafruit.com/2026/04/07/micropython-v1-28-0-released/) · [Python 3.15 released / MicroPython 1.30 (Adafruit, ott 2026)](https://blog.adafruit.com/2026/10/13/icymi-python-on-microcontrollers-newsletter-python-3-15-released-while-micropython-1-30-is-getting-closer-and-more/)
- [lvgl/lv_micropython](https://github.com/lvgl/lv_micropython) · [lvgl/lv_binding_micropython](https://github.com/lvgl/lv_binding_micropython) · [lvgl-micropython/lvgl_micropython](https://github.com/lvgl-micropython/lvgl_micropython)
- Verifiche dirette: header di `lvgl` al tag `v9.6.0` (`include/lvgl/**`, `api_map/*.h`), sottomodulo `lvgl` del binding MicroPython (commit `c033a98`, `LVGL_VERSION 9.3.0`), `lv_micropython/py/mpconfig.h` (MicroPython 1.24.1), `gen/gen_mpy.py`.
