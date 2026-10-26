# LVGL Visual Editor

An open-source graphical editor for LVGL (Light and Versatile Graphics Library) that automatically generates code in C and MicroPython.

![LVGL Editor](docs/screenshot.png)

## About This Project

This project was developed through **"vibe coding"** with Claude AI assistance. The author had no prior experience with React, Electron, or modern frontend development frameworks. Through an iterative, conversational development process, Claude helped design the architecture, implement features, debug issues, and create a fully functional visual editor for LVGL.

This demonstrates how AI-assisted development can enable developers to build sophisticated applications even in unfamiliar technology stacks, by focusing on the vision and functionality while the AI handles the technical implementation details.

## Features

### 🎨 Visual Editor
- **Drag & Drop**: Drag widgets directly onto the canvas
- **Real-time Properties**: Modify widget properties and see changes immediately
- **Grid & Snap**: Grid system with automatic snap for precise alignment
- **Zoom**: Zoom in and out of the canvas view

### 🔧 Supported Widgets
- **Base**: Button, Label, Panel
- **Input**: Slider, Switch, Checkbox, Textarea, Dropdown, Roller
- **Display**: Progress Bar, Arc, Spinner, Chart
- **Media**: Image, Image Button

### 📤 Code Generation
- **C Generator**: targets **LVGL 9.6** and uses no deprecated API (it also builds with `LV_DISABLE_API_MAPPING`, ready for LVGL 10)
- **MicroPython Generator**: targets the official **lv_micropython** firmware (MicroPython 1.24.1 with LVGL 9.3)
- **Verified output**: CI compiles the generated C against the LVGL 9.6 headers and runs the generated MicroPython on the lv_micropython firmware (see `scripts/lvgl-api/README.md`)
- **Widget handles**: every widget is reachable from application code (`ui_<name>` in C, `objects["<name>"]` in MicroPython)
- **Customizable Templates**: External template files that can be modified
- **Export**: Export directly to file or copy to clipboard

### 💾 Project Management
- **Save/Load**: Save projects in JSON format
- **Undo/Redo**: Complete history system
- **Multi-page**: Support for multi-page projects (coming soon)

## Architecture

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

## Technology Stack

- **Frontend**: React 18 + Vite
- **Desktop**: Electron
- **Canvas**: React-Konva (based on Konva.js)
- **State Management**: Zustand
- **Code Generation**: Template-based generators
- **Styling**: CSS modules

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/lvgl-editor.git
cd lvgl-editor

# Install dependencies
npm install

# Start in development mode (browser only)
npm run dev:renderer

# To test the complete Electron app (requires additional setup)
npm run dev
```

## Usage

### 1. Create a New Project
1. Click "New" in the toolbar
2. Set the project name

### 2. Add Widgets
1. Select a widget from the palette on the left
2. Click to add it to the canvas
3. Drag to position it

### 3. Modify Properties
1. Select a widget on the canvas
2. Modify properties in the panel on the right
3. Changes are applied in real-time

### 4. Export Code
1. Click "Export Code"
2. Select the language (C or MicroPython)
3. Copy to clipboard or export to file

### 5. Save Project
1. Click "Save"
2. Choose the location and file name
3. The project is saved in JSON format

## Generated Code Example

A page with one button and a click handler (excerpt):

### C (LVGL 9.6)
```c
#include "lvgl.h"

/* Fonts used: enable LV_FONT_MONTSERRAT_16 in lv_conf.h */

/* Widget handles (use `extern lv_obj_t * ui_<name>;` to access them from other files) */
lv_obj_t * ui_button_1;

static void on_click(lv_event_t *e);

void my_ui_create_main(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv_screen_active();
    }

    /* button: button_1 */
    ui_button_1 = lv_button_create(parent);
    lv_obj_set_pos(ui_button_1, 100, 50);
    lv_obj_set_size(ui_button_1, 120, 40);
    lv_obj_set_style_bg_color(ui_button_1, lv_color_hex(0x2196F3), LV_PART_MAIN);
    lv_obj_set_style_radius(ui_button_1, 5, LV_PART_MAIN);
    lv_obj_t * button_1_label = lv_label_create(ui_button_1);
    lv_label_set_text(button_1_label, "Click Me");
    lv_obj_center(button_1_label);
    lv_obj_set_style_text_color(button_1_label, lv_color_hex(0xFFFFFF), LV_PART_MAIN);
    lv_obj_set_style_text_font(button_1_label, &lv_font_montserrat_16, LV_PART_MAIN);
    lv_obj_add_event_cb(ui_button_1, on_click, LV_EVENT_CLICKED, NULL);
}
```

### MicroPython (lv_micropython)
```python
import lvgl as lv

# Created widgets, by name (e.g. objects["ok_button"])
objects = {}

def my_ui_create_main(parent=None):
    if parent is None:
        parent = lv.screen_active()

    # button: button_1
    button_1 = lv.button(parent)
    objects["button_1"] = button_1
    button_1.set_pos(100, 50)
    button_1.set_size(120, 40)
    button_1.set_style_bg_color(lv.color_hex(0x2196F3), lv.PART.MAIN)
    button_1.set_style_radius(5, lv.PART.MAIN)
    button_1_label = lv.label(button_1)
    button_1_label.set_text("Click Me")
    button_1_label.center()
    button_1_label.set_style_text_color(lv.color_hex(0xFFFFFF), lv.PART.MAIN)
    button_1_label.set_style_text_font(lv.font_montserrat_16, lv.PART.MAIN)
    button_1.add_event_cb(on_click, lv.EVENT.CLICKED, None)
```

Notes on the targets:
- LVGL 9.6 deprecates `lv_list`, `lv_win` and `lv_menu`: the generator builds these widgets from base widgets in a flex column, as LVGL recommends.
- `lv.spinner` is not exported by the lv_micropython binding: in MicroPython the spinner is an arc rotated by an endless animation.
- The default lv_micropython firmware includes the Montserrat fonts 14, 16 and 24 only: MicroPython font sizes are mapped to the closest of these.

## Roadmap

### v1.0 (MVP) ✅
- [x] Basic visual editor
- [x] Fundamental widgets
- [x] C and MicroPython generators
- [x] Property system
- [x] Code export

### v1.1 ✅
- [x] Event handlers
- [x] Animations
- [x] Custom styles
- [x] Widget hierarchy (parent-child)

### v1.2 ✅
- [x] Multi-page support
- [x] Screen templates
- [x] Asset management (images, fonts)
- [ ] Preview on real device

### v2.0 ✅
- [x] Collaborative editing
- [x] Component library
- [x] Plugin system
- [x] Cloud sync

### v2.1 ✅
- [x] Advanced widget library (Chart, Roller, Dropdown, Image, Image Button)
- [x] Pre-built component templates
- [x] Template categories and organization
- [x] Enhanced component library interface with tabs

### v2.2 ✅
- [x] Customizable code generation templates (external .hbs files)
- [x] Template loader with automatic fallback to defaults
- [x] Full Handlebars support for code templates
- [x] Template editing via external files

### v2.3 ✅
- [x] Multi-architecture template system (Unix, STM32, ESP32)
- [x] Architecture selector in code export dialog
- [x] Organized template directory structure by architecture
- [x] Persistent architecture preference per project
- [x] Easy addition of custom architectures

## v2.0 Features

### 🧩 Component Library
The component library allows you to save and reuse groups of widgets as custom components:

- **Save Components**: Select widgets (with their children) and save them as reusable components
- **Library Management**: Organize components with name, description and tags
- **Import/Export**: Share your component library with other users
- **Search**: Quickly find components by name, description or tags

**How to use:**
1. Select a widget on the canvas
2. Click the floating "Component Library" button (bottom left)
3. Click "Save Component" and enter the details
4. To insert a component, click "+" next to the desired component

### 🔌 Plugin System
Extensible system for loading external plugins that add new functionality:

- **Plugin Loading**: Load plugins from URL or JavaScript code
- **Custom Widgets**: Plugins can add new widget types
- **Custom Generators**: Add support for new output languages
- **Hook System**: Plugins can intercept editor events
- **Plugin Management**: Enable/disable plugins dynamically

**Plugin Structure:**
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
Sync your projects with the cloud to access them from any device:

- **Multiple Providers**: Support for different cloud providers (Local Storage included)
- **Auto-Sync**: Automatic synchronization every 5 minutes (optional)
- **Project Management**: List, load and delete projects from the cloud
- **Automatic Backup**: Auto-save to never lose your work

**Available Providers:**
- Local Storage (demo/offline)
- Custom providers via API

### 👥 Collaborative Editing
Work on projects in real-time with other users:

- **Multi-User Sessions**: Create or join collaborative sessions
- **Real-Time Sync**: See other users' changes in real-time
- **User Awareness**: View who is connected with distinctive colors
- **Cursor Tracking**: See where other users are working
- **Conflict Resolution**: Automatic conflict management system

**Getting started:**
1. Click the "Collaboration" button (bottom right)
2. Choose "Join Session"
3. Enter server URL and session ID (or generate a new one)
4. Share the session ID with collaborators

**Note:** Real-time collaboration requires a WebSocket server. The current version includes a demo implementation for local development.

## v2.1 Features

### 📊 Advanced Widget Types
Version 2.1 introduces 5 new professional widget types for building sophisticated UIs:

#### Chart Widget
Visualize data with interactive charts:
- **Chart Types**: Line charts and bar charts
- **Customizable Data**: Set data points via comma-separated values
- **Styling**: Configurable colors for background, lines, and points
- **Interactive Points**: Toggle point visibility for line charts

**Properties:**
- Chart type (line, bar, scatter)
- Data points (comma-separated)
- Line/bar color
- Background color
- Point visibility

#### Roller Widget
Create scrollable option selectors with 3D cylinder effect:
- **Visible Rows**: Configure how many rows are visible
- **Selected Highlight**: Highlighted selected option
- **Custom Options**: Define options via newline-separated text
- **Styling**: Customize background, selected color, and text color

**Properties:**
- Options (newline-separated)
- Selected index
- Visible rows (default: 3)
- Background, selected, and text colors

#### Dropdown Widget
Standard dropdown selection menus:
- **Multiple Options**: Support for multiple selectable options
- **Keyboard Navigation**: Full keyboard support
- **Custom Styling**: Configurable colors and fonts
- **Current Selection Display**: Shows currently selected option

**Properties:**
- Options (newline-separated)
- Selected index
- Background and text colors
- Font size

#### Image Widget
Display images in your interface:
- **Image Source**: Support for image URLs
- **Fit Modes**: Contain, cover, or fill
- **Placeholder**: Visual placeholder when no image is set
- **Background Color**: Configurable background

**Properties:**
- Image source URL
- Object fit mode
- Background color
- Width/height

#### Image Button Widget
Combine images with interactive buttons:
- **Image + Text**: Display both image and text label
- **Custom Styling**: Configurable colors and corner radius
- **Flexible Layout**: Image area with text overlay
- **Click Events**: Full event support

**Properties:**
- Image source URL
- Button text
- Background and text colors
- Corner radius
- Font size

### 🎨 Pre-Built Component Templates
Six professional templates ready to use in your projects:

#### 1. Dashboard Chart 📊
Complete analytics panel perfect for data visualization:
- Panel container with border
- Title label "Statistics"
- Line chart with sample data
- Current value indicator
- **10 widgets** ready to customize

**Use cases:** Analytics dashboards, monitoring panels, data visualization

#### 2. Settings Control Panel ⚙️
Configuration interface with multiple control types:
- Settings panel with title
- Brightness slider (0-100)
- Volume slider (0-100)
- WiFi toggle switch
- Bluetooth toggle switch
- **10 widgets** organized and labeled

**Use cases:** Device settings, configuration screens, control panels

#### 3. Image Gallery 🖼️
Photo gallery layout with grid organization:
- Gallery panel with title
- 3 image placeholders (top row)
- 3 image buttons (bottom row)
- Customizable colors per image
- **8 widgets** in grid layout

**Use cases:** Photo galleries, product showcases, media browsers

#### 4. Data Entry Form 📝
Complete user input form with various input types:
- Form panel with title
- Country dropdown (8 countries)
- Age group roller (6 age ranges)
- Terms & conditions checkbox
- Submit button
- **9 widgets** with labels

**Use cases:** User registration, data collection, surveys

#### 5. Progress Monitor 📈
Task tracking with multiple progress indicators:
- Progress panel with title
- 2 labeled progress bars (Task 1, Task 2)
- Circular arc for overall progress
- Loading spinner with label
- **10 widgets** showing progress

**Use cases:** Task monitoring, download progress, loading states

#### 6. Navigation Menu ☰
Vertical sidebar navigation:
- Dark themed panel
- Menu title
- 5 navigation buttons with icons:
  - 🏠 Home
  - ⚙️ Settings
  - 👤 Profile
  - ✉️ Messages
  - ❓ Help
- **7 widgets** in sidebar layout

**Use cases:** Application navigation, menu sidebars, app drawers

### 📚 Enhanced Component Library Interface

The Component Library has been redesigned with a tab-based interface:

#### Templates Tab
- **Pre-Built Templates**: Access all 6 professional templates
- **Category Organization**: Templates grouped by category
  - Data Display
  - Controls
  - Media
  - Forms
  - Navigation
- **Template Preview**: See icon, name, description, and widget count
- **One-Click Insert**: Add complete layouts with a single click
- **Search**: Filter templates by name, description, or tags

#### My Components Tab
- **User-Saved Components**: Your custom saved components
- **Component Management**: Save, insert, and delete components
- **Import/Export**: Share component libraries
- **Search**: Find components by name, description, or tags

**Visual Enhancements:**
- Gradient backgrounds for templates
- Category headers with styling
- Icon indicators for template types
- Enhanced hover effects
- Improved spacing and organization

### 🎯 How to Use Templates

1. Click the **Component Library** button (bottom-left, package icon)
2. Switch to the **Templates** tab
3. Browse templates by category or use search
4. Click the **+** button on any template to insert it
5. Customize the inserted widgets in the Properties panel

All template widgets are inserted with a small offset and can be individually selected, moved, and customized just like manually created widgets.

## v2.2 Features

### 🔧 Customizable Code Generation Templates

Version 2.2 introduces a powerful template system that allows you to fully customize the structure and format of generated C and MicroPython code by editing external template files.

**Note:** Starting with v2.3, templates are organized by architecture. See the v2.3 section for the updated directory structure.

#### Template Files Location (Updated in v2.3)

Templates are organized by target architecture in subdirectories:
- `templates/unix/` - Generic Unix/Linux templates
- `templates/stm32/` - STM32 microcontroller templates
- `templates/esp32/` - ESP32 microcontroller templates

Each architecture directory contains:
- `c_template.hbs` - C code template
- `micropython_template.hbs` - MicroPython template

Every project has at least one page; the same templates handle any number of pages.

#### How to Customize Templates

The bundled templates are read-only. A customized copy is saved in the application's
data directory (`<userData>/templates/{architecture}/`) and takes precedence over the
bundled one; templates are loaded at code generation time.

#### Template Variables

Templates use Handlebars syntax with the following variables:

- `{{projectName}}` - Name of the project
- `{{generatedDate}}` - ISO timestamp of code generation
- `{{declarations}}` - File-scope declarations: widget handles, fonts and images in use, helper functions (C); the `objects` dictionary (MicroPython)
- `{{pageCount}}` - Total number of pages
- `{{lastPageIndex}}` - Index of last page (pageCount - 1)
- `{{baseName}}` - Base name for functions
- `{{#each pages}}...{{/each}}` - Loop through pages
  - `{{this.name}}` - Page name
  - `{{this.functionName}}` - Page function name
  - `{{this.width}}`, `{{this.height}}` - Page dimensions
  - `{{this.widgetCount}}` - Number of widgets in page
  - `{{#each this.widgets}}{{this}}{{/each}}` - Code of each widget
- `{{hasEventCallbacks}}` - Whether there are event handlers
- `{{#each eventCallbacks}}...{{/each}}` - Event handlers
  - `{{this.name}}` - Handler function name
  - `{{indent this.body 4}}` - Handler body (one branch per event code), re-indented by 4 spaces

#### Example Customizations

**Add a custom header:**
```handlebars
/*
 * Company: My Company
 * Project: {{projectName}}
 * Generated: {{generatedDate}}
 */
```

**Add custom includes:**
```handlebars
#include "lvgl.h"
#include "my_custom_widgets.h"
#include "project_config.h"
```

**Modify code structure:**
You can reorganize the generated code structure, add comments, change indentation, or include project-specific boilerplate.

#### Reset to Defaults

Delete the customized copy in the application's data directory: the bundled template is used again.

#### Notes

- The output is source code, so values are never HTML-escaped: `{{variable}}` and `{{{variable}}}` produce the same text
- The `indent` helper re-indents multi-line text, which keeps user code valid inside Python blocks
- Handlebars helpers like `{{#if}}`, `{{#each}}`, `{{#unless}}` are supported

## v2.3 Features

### 🏗️ Multi-Architecture Template System

Version 2.3 introduces support for multiple target architectures, allowing you to generate code optimized for different platforms with architecture-specific includes, initialization code, and configuration.

#### Supported Architectures

The editor now supports the following target architectures:

1. **Unix/Linux** (default)
   - Generic Unix/Linux systems
   - Standard LVGL includes
   - Suitable for desktop applications and simulators

2. **STM32**
   - STM32 microcontrollers with LVGL
   - Includes STM32 HAL headers (`#include "main.h"`)
   - Optimized for embedded STM32 targets

3. **ESP32**
   - ESP32 microcontrollers (ESP-IDF or Arduino)
   - Optional ESP-IDF or Arduino framework includes
   - Suitable for IoT and embedded ESP32 applications

#### How to Select Architecture

1. Open the **Code Export** dialog (Export button in toolbar)
2. Select your desired **Target Architecture** from the dropdown
3. Choose the programming language (C or MicroPython)
4. The generated code will use architecture-specific templates

Your architecture selection is **automatically saved** with the project and will be remembered for future code exports.

#### Template Directory Structure

```
templates/
├── unix/
│   ├── c_template.hbs
│   └── micropython_template.hbs
├── stm32/
│   ├── c_template.hbs
│   └── micropython_template.hbs
└── esp32/
    ├── c_template.hbs
    └── micropython_template.hbs
```

#### Adding Custom Architectures

You can easily add support for additional architectures:

1. **Create Architecture Directory**
   ```bash
   mkdir templates/my_custom_arch
   ```

2. **Copy Template Files**
   ```bash
   cp templates/unix/*.hbs templates/my_custom_arch/
   ```

3. **Edit Templates**
   - Modify the `.hbs` files in `templates/my_custom_arch/`
   - Add architecture-specific includes, initialization code, etc.

4. **Register Architecture** (in `src/generators/templateLoader.js`):
   ```javascript
   export const ARCHITECTURES = {
     UNIX: 'unix',
     STM32: 'stm32',
     ESP32: 'esp32',
     MY_CUSTOM: 'my_custom_arch',  // Add your architecture
   };
   ```

   Add it also to the `ARCHITECTURES` whitelist in `src/main/templateStore.js`: the Electron main process only reads and writes templates of listed architectures.

5. **Add to Selector** (in `getAvailableArchitectures()`):
   ```javascript
   {
     id: ARCHITECTURES.MY_CUSTOM,
     name: 'My Custom Platform',
     description: 'Custom platform description'
   }
   ```

#### Architecture-Specific Template Differences

Each architecture can have different:

- **Include statements**: Platform-specific headers
- **Initialization code**: Hardware-specific setup
- **Function naming**: Architecture conventions
- **Comments and documentation**: Platform-specific notes
- **Memory management**: Stack/heap considerations
- **Build configuration**: Compiler flags and settings

#### Example: STM32 Template Customization

The STM32 templates include:
```c
#include "lvgl.h"
#include "main.h"  // STM32 HAL includes
```

And include notes about initialization:
```c
/**
 * Initialize and show the UI
 * Call this after LVGL and display are initialized
 */
```

#### Example: ESP32 Template Customization

The ESP32 templates include framework-specific comments:
```c
// Uncomment based on your framework:
// #include "esp_log.h"        // For ESP-IDF
// #include <Arduino.h>        // For Arduino
```

This allows developers to quickly adapt the generated code to their specific ESP32 development environment.

## Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is released under the MIT license. See the [LICENSE](LICENSE) file for details.

## Credits

- **LVGL**: https://lvgl.io/
- **React**: https://react.dev/
- **Konva**: https://konvajs.org/
- **Electron**: https://www.electronjs.org/
- **Claude AI**: Development assistant that made this project possible

## Support

For bug reports and feature requests, open an issue on GitHub.

---

Made with ❤️ for the LVGL community (and with a lot of help from Claude AI!)
