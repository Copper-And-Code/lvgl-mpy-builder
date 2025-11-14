# LVGL Visual Editor

Un editor grafico open-source per LVGL (Light and Versatile Graphics Library) che genera automaticamente codice in C e MicroPython.

![LVGL Editor](docs/screenshot.png)

## Informazioni sul Progetto

Questo progetto è stato sviluppato attraverso il **"vibe coding"** con l'assistenza di Claude AI. L'autore non aveva alcuna esperienza pregressa con React, Electron o framework di sviluppo frontend moderni. Attraverso un processo di sviluppo iterativo e conversazionale, Claude ha aiutato a progettare l'architettura, implementare le funzionalità, risolvere i problemi e creare un editor visuale completamente funzionale per LVGL.

Questo dimostra come lo sviluppo assistito dall'AI possa permettere agli sviluppatori di costruire applicazioni sofisticate anche in stack tecnologici non familiari, concentrandosi sulla visione e sulle funzionalità mentre l'AI si occupa dei dettagli tecnici dell'implementazione.

## Caratteristiche

### 🎨 Editor Visuale
- **Drag & Drop**: Trascina i widget direttamente sul canvas
- **Proprietà Real-time**: Modifica le proprietà dei widget e vedi i cambiamenti immediatamente
- **Grid & Snap**: Sistema di griglia con snap automatico per allineamento preciso
- **Zoom**: Ingrandisci e riduci la vista del canvas

### 🔧 Widget Supportati
- **Base**: Button, Label, Panel
- **Input**: Slider, Switch, Checkbox, Textarea
- **Display**: Progress Bar, Arc, Spinner

### 📤 Generazione Codice
- **C Generator**: Genera codice C ottimizzato per LVGL
- **MicroPython Generator**: Genera codice MicroPython compatibile
- **Export**: Esporta direttamente su file o copia negli appunti

### 💾 Gestione Progetti
- **Salva/Carica**: Salva progetti in formato JSON
- **Undo/Redo**: Sistema di history completo
- **Multi-pagina**: Supporto per progetti con pagine multiple (coming soon)

## Architettura

```
lvgl-editor/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js
│   │   └── preload.js
│   ├── core/              # Core engine
│   │   ├── widgetDefinitions.js
│   │   └── store.js       # Zustand state management
│   ├── generators/        # Code generators
│   │   ├── cGenerator.js
│   │   └── micropythonGenerator.js
│   ├── components/        # React components
│   │   ├── Canvas.jsx
│   │   ├── WidgetRenderer.jsx
│   │   ├── WidgetPalette.jsx
│   │   ├── PropertiesPanel.jsx
│   │   ├── Toolbar.jsx
│   │   └── CodeExportModal.jsx
│   └── styles/            # CSS styles
├── public/                # Static assets
└── package.json
```

## Stack Tecnologico

- **Frontend**: React 18 + Vite
- **Desktop**: Electron
- **Canvas**: React-Konva (basato su Konva.js)
- **State Management**: Zustand
- **Code Generation**: Template-based generators
- **Styling**: CSS modules

## Installazione

### Prerequisiti
- Node.js 18 o superiore
- npm o yarn

### Setup

```bash
# Clona il repository
git clone https://github.com/yourusername/lvgl-editor.git
cd lvgl-editor

# Installa le dipendenze
npm install

# Avvia in modalità sviluppo (solo browser)
npm run dev:renderer

# Per testare l'app Electron completa (richiede setup aggiuntivo)
npm run dev
```

## Utilizzo

### 1. Creare un Nuovo Progetto
1. Clicca su "New" nella toolbar
2. Imposta il nome del progetto

### 2. Aggiungere Widget
1. Seleziona un widget dalla palette a sinistra
2. Clicca per aggiungerlo al canvas
3. Trascina per posizionarlo

### 3. Modificare Proprietà
1. Seleziona un widget sul canvas
2. Modifica le proprietà nel pannello a destra
3. Le modifiche vengono applicate in tempo reale

### 4. Esportare il Codice
1. Clicca su "Export Code"
2. Seleziona il linguaggio (C o MicroPython)
3. Copia negli appunti o esporta su file

### 5. Salvare il Progetto
1. Clicca su "Save"
2. Scegli la posizione e il nome del file
3. Il progetto viene salvato in formato JSON

## Esempio di Codice Generato

### C
```c
#include "lvgl.h"

void my_ui_create(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv_scr_act();
    }

    /* Create button: button_1 */
    lv_obj_t *button_1 = lv_btn_create(parent);
    lv_obj_set_pos(button_1, 100, 50);
    lv_obj_set_size(button_1, 120, 40);
    lv_obj_set_style_bg_color(button_1, lv_color_make(33, 150, 243), LV_PART_MAIN);

    lv_obj_t *button_1_label = lv_label_create(button_1);
    lv_label_set_text(button_1_label, "Click Me");
    lv_obj_center(button_1_label);
}
```

### MicroPython
```python
import lvgl as lv

def my_ui_create(parent=None):
    if parent is None:
        parent = lv.scr_act()

    # Create button: button_1
    button_1 = lv.btn(parent)
    button_1.set_pos(100, 50)
    button_1.set_size(120, 40)
    button_1.set_style_bg_color(lv.color_make(0x21, 0x96, 0xF3), lv.PART.MAIN)

    button_1_label = lv.label(button_1)
    button_1_label.set_text("Click Me")
    button_1_label.center()
```

## Roadmap

### v1.0 (MVP) ✅
- [x] Editor visuale base
- [x] Widget fondamentali
- [x] Generatori C e MicroPython
- [x] Sistema di proprietà
- [x] Export codice

### v1.1 ✅
- [x] Event handlers
- [x] Animations
- [x] Custom styles
- [x] Widget hierarchy (parent-child)

### v1.2 ✅
- [x] Multi-page support
- [x] Screen templates
- [x] Asset management (images, fonts)
- [ ] Preview sul dispositivo reale

### v2.0 ✅
- [x] Collaborative editing
- [x] Component library
- [x] Plugin system
- [x] Cloud sync

## Funzionalità v2.0

### 🧩 Component Library
La libreria di componenti permette di salvare e riutilizzare gruppi di widget come componenti personalizzati:

- **Salva Componenti**: Seleziona widget (con relativi figli) e salvali come componente riutilizzabile
- **Gestione Libreria**: Organizza i componenti con nome, descrizione e tag
- **Import/Export**: Condividi la tua libreria di componenti con altri utenti
- **Ricerca**: Trova rapidamente i componenti per nome, descrizione o tag

**Come usare:**
1. Seleziona un widget sul canvas
2. Clicca sul pulsante floating "Component Library" (in basso a sinistra)
3. Clicca "Save Component" e inserisci i dettagli
4. Per inserire un componente, clicca su "+" accanto al componente desiderato

### 🔌 Plugin System
Sistema estensibile per caricare plugin esterni che aggiungono nuove funzionalità:

- **Caricamento Plugin**: Carica plugin da URL o codice JavaScript
- **Custom Widgets**: I plugin possono aggiungere nuovi tipi di widget
- **Custom Generators**: Aggiungi supporto per nuovi linguaggi di output
- **Hook System**: I plugin possono intercettare eventi dell'editor
- **Gestione Plugin**: Abilita/disabilita plugin dinamicamente

**Struttura Plugin:**
```javascript
module.exports.default = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Plugin description',

  initialize() {
    // Setup code
  },

  hooks: {
    'widget:created': (widget) => {
      // Called when a widget is created
      return widget;
    }
  },

  widgets: [
    // Custom widget definitions
  ],

  generators: [
    // Custom code generators
  ]
};
```

### ☁️ Cloud Sync
Sincronizza i tuoi progetti con il cloud per accedervi da qualsiasi dispositivo:

- **Provider Multipli**: Supporto per diversi provider cloud (Local Storage incluso)
- **Auto-Sync**: Sincronizzazione automatica ogni 5 minuti (opzionale)
- **Gestione Progetti**: Lista, carica ed elimina progetti dal cloud
- **Backup Automatico**: Salvataggio automatico per non perdere il lavoro

**Provider Disponibili:**
- Local Storage (demo/offline)
- Custom providers via API

### 👥 Collaborative Editing
Lavora sui progetti in tempo reale con altri utenti:

- **Sessioni Multi-Utente**: Crea o unisciti a sessioni collaborative
- **Real-Time Sync**: Vedi le modifiche degli altri utenti in tempo reale
- **User Awareness**: Visualizza chi è connesso con colori distintivi
- **Cursor Tracking**: Vedi dove stanno lavorando gli altri utenti
- **Conflict Resolution**: Sistema di gestione conflitti automatico

**Come iniziare:**
1. Clicca sul pulsante "Collaboration" (in basso a destra)
2. Scegli "Join Session"
3. Inserisci server URL e session ID (o generane uno nuovo)
4. Condividi il session ID con i collaboratori

**Nota:** Per la collaborazione in tempo reale è necessario un server WebSocket. La versione attuale include un'implementazione demo per sviluppo locale.

## Contribuire

I contributi sono benvenuti! Per favore:

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## Crediti

- **LVGL**: https://lvgl.io/
- **React**: https://react.dev/
- **Konva**: https://konvajs.org/
- **Electron**: https://www.electronjs.org/
- **Claude AI**: Assistente di sviluppo che ha reso possibile questo progetto

## Support

Per bug reports e feature requests, apri una issue su GitHub.

---

Made with ❤️ for the LVGL community (e con tanto aiuto da Claude AI!)
