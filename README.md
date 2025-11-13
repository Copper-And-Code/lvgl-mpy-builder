# LVGL Visual Editor

Un editor grafico open-source per LVGL (Light and Versatile Graphics Library) che genera automaticamente codice in C e MicroPython.

![LVGL Editor](docs/screenshot.png)

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

### v2.0
- [ ] Collaborative editing
- [ ] Component library
- [ ] Plugin system
- [ ] Cloud sync

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

## Support

Per bug reports e feature requests, apri una issue su GitHub.

---

Made with ❤️ for the LVGL community
