import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createWidget } from './widgetDefinitions';
import { DEFAULT_ARCHITECTURE } from '../generators/templateLoader';

const useStore = create((set, get) => ({
  // Project state
  projectName: 'Untitled Project',
  projectPath: null,
  targetArchitecture: DEFAULT_ARCHITECTURE, // v2.3: Target architecture for code generation

  // Display presets for quick configuration
  displayPresets: [
    { name: '1024x600 (7" LVGL Default)', width: 1024, height: 600 },
    { name: '800x480 (5" TFT)', width: 800, height: 480 },
    { name: '480x320 (3.5" TFT)', width: 480, height: 320 },
    { name: '320x240 (2.8" TFT)', width: 320, height: 240 },
    { name: '240x240 (1.3" Square)', width: 240, height: 240 },
    { name: '128x64 (OLED)', width: 128, height: 64 },
    { name: '480x272 (4.3" TFT)', width: 480, height: 272 },
    { name: '1280x720 (HD)', width: 1280, height: 720 },
    { name: '1920x1080 (Full HD)', width: 1920, height: 1080 },
  ],

  // Multi-page support (v1.2)
  pages: [
    {
      id: 'page_1',
      name: 'Main Screen',
      widgets: [],
      canvasSize: { width: 1024, height: 600 },
    }
  ],
  currentPageId: 'page_1',

  // Assets management (v1.2)
  assets: {
    images: [], // { id, name, path, data }
    fonts: [],  // { id, name, path, size }
  },

  // Component Library (v2.0)
  componentLibrary: [], // { id, name, description, widgets, thumbnail, tags, createdAt }

  // Canvas state
  widgets: [],
  selectedWidgetId: null,
  canvasSize: { width: 1024, height: 600 }, // Default LVGL display size (configurable)
  zoom: 1,
  gridEnabled: true,
  snapToGrid: true,
  gridSize: 10,

  // History for undo/redo
  history: [],
  historyIndex: -1,
  maxHistory: 50,

  // Actions
  setProjectName: (name) => set({ projectName: name }),

  setProjectPath: (path) => set({ projectPath: path }),

  setTargetArchitecture: (architecture) => set({ targetArchitecture: architecture }),

  setCanvasSize: (size) => {
    set({ canvasSize: size });
    // Also update current page's canvas size
    get().savePageWidgets();
  },

  applyDisplayPreset: (preset) => {
    const size = { width: preset.width, height: preset.height };
    set({ canvasSize: size });
    get().savePageWidgets();
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  // Widget management
  addWidget: (type, position) => {
    const id = uuidv4();
    const newWidget = createWidget(type, id, position);

    set((state) => ({
      widgets: [...state.widgets, newWidget],
      selectedWidgetId: id,
    }));

    get().saveHistory();
  },

  updateWidget: (id, props) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, props: { ...w.props, ...props } } : w
      ),
    }));
    get().saveHistory();
  },

  updateWidgetEvents: (id, events) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, events } : w
      ),
    }));
    get().saveHistory();
  },

  updateWidgetAnimations: (id, animations) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, animations: animations || [] } : w
      ),
    }));
    get().saveHistory();
  },

  updateWidgetParent: (id, parentId) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, parentId: parentId || null } : w
      ),
    }));
    get().saveHistory();
  },

  updateWidgetStyles: (id, styles) => {
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, customStyles: styles || {} } : w
      ),
    }));
    get().saveHistory();
  },

  deleteWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    }));
    get().saveHistory();
  },

  selectWidget: (id) => set({ selectedWidgetId: id }),

  deselectWidget: () => set({ selectedWidgetId: null }),

  duplicateWidget: (id) => {
    const widget = get().widgets.find((w) => w.id === id);
    if (widget) {
      const newId = uuidv4();
      const duplicated = {
        ...widget,
        id: newId,
        name: `${widget.name}_copy`,
        props: {
          ...widget.props,
          x: widget.props.x + 20,
          y: widget.props.y + 20,
        },
      };

      set((state) => ({
        widgets: [...state.widgets, duplicated],
        selectedWidgetId: newId,
      }));

      get().saveHistory();
    }
  },

  moveWidgetToFront: (id) => {
    set((state) => {
      const widget = state.widgets.find((w) => w.id === id);
      if (!widget) return state;

      return {
        widgets: [...state.widgets.filter((w) => w.id !== id), widget],
      };
    });
  },

  moveWidgetToBack: (id) => {
    set((state) => {
      const widget = state.widgets.find((w) => w.id === id);
      if (!widget) return state;

      return {
        widgets: [widget, ...state.widgets.filter((w) => w.id !== id)],
      };
    });
  },

  // History management
  saveHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.stringify(state.widgets));

      if (newHistory.length > state.maxHistory) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const widgets = JSON.parse(state.history[newIndex]);
      set({ widgets, historyIndex: newIndex });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const widgets = JSON.parse(state.history[newIndex]);
      set({ widgets, historyIndex: newIndex });
    }
  },

  // Page management (v1.2)
  addPage: (name) => {
    // Persist the page we are leaving, otherwise its widgets leak into the new page
    get().savePageWidgets();

    const id = `page_${uuidv4()}`;
    const currentCanvasSize = get().canvasSize;
    const newPage = {
      id,
      name: name || `Page ${get().pages.length + 1}`,
      widgets: [],
      canvasSize: { ...currentCanvasSize },
    };

    set((state) => ({
      pages: [...state.pages, newPage],
      currentPageId: id,
      widgets: [],
      selectedWidgetId: null,
    }));
  },

  deletePage: (pageId) => {
    const state = get();
    if (state.pages.length <= 1) {
      alert('Cannot delete the last page');
      return;
    }

    const pageIndex = state.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const newPages = state.pages.filter(p => p.id !== pageId);
    let newCurrentPageId = state.currentPageId;

    if (pageId === state.currentPageId) {
      newCurrentPageId = pageIndex > 0 ? newPages[pageIndex - 1].id : newPages[0].id;
    }

    set({
      pages: newPages,
      currentPageId: newCurrentPageId,
    });

    get().loadPageWidgets(newCurrentPageId);
  },

  renamePage: (pageId, newName) => {
    set((state) => ({
      pages: state.pages.map(p =>
        p.id === pageId ? { ...p, name: newName } : p
      ),
    }));
  },

  switchPage: (pageId) => {
    // Save current page state
    const currentPage = get().pages.find(p => p.id === get().currentPageId);
    if (currentPage) {
      get().savePageWidgets();
    }

    // Load new page
    set({ currentPageId: pageId });
    get().loadPageWidgets(pageId);
  },

  savePageWidgets: () => {
    const state = get();
    set((s) => ({
      pages: s.pages.map(p =>
        p.id === state.currentPageId
          ? { ...p, widgets: state.widgets, canvasSize: state.canvasSize }
          : p
      ),
    }));
  },

  loadPageWidgets: (pageId) => {
    const page = get().pages.find(p => p.id === pageId);
    if (page) {
      set({
        widgets: page.widgets || [],
        canvasSize: page.canvasSize || { width: 800, height: 480 },
        selectedWidgetId: null,
      });
    }
  },

  duplicatePage: (pageId) => {
    const page = get().pages.find(p => p.id === pageId);
    if (page) {
      const newId = `page_${uuidv4()}`;
      const duplicated = {
        ...page,
        id: newId,
        name: `${page.name} (Copy)`,
        widgets: page.widgets.map(w => ({
          ...w,
          id: uuidv4(),
        })),
      };

      set((state) => ({
        pages: [...state.pages, duplicated],
      }));
    }
  },

  // Assets management (v1.2)
  addAsset: (type, asset) => {
    set((state) => ({
      assets: {
        ...state.assets,
        [type]: [...state.assets[type], { ...asset, id: uuidv4() }],
      },
    }));
  },

  removeAsset: (type, assetId) => {
    set((state) => ({
      assets: {
        ...state.assets,
        [type]: state.assets[type].filter(a => a.id !== assetId),
      },
    }));
  },

  getAsset: (type, assetId) => {
    const assets = get().assets[type];
    return assets.find(a => a.id === assetId);
  },

  // Component Library management (v2.0)
  saveAsComponent: (name, description, tags = []) => {
    const state = get();
    const selectedWidget = state.widgets.find(w => w.id === state.selectedWidgetId);

    if (!selectedWidget) {
      alert('Please select a widget to save as component');
      return;
    }

    // Get selected widget and all its children
    const getWidgetWithChildren = (widgetId) => {
      const widget = state.widgets.find(w => w.id === widgetId);
      if (!widget) return [];

      const children = state.widgets.filter(w => w.parentId === widgetId);
      const allWidgets = [widget];

      children.forEach(child => {
        allWidgets.push(...getWidgetWithChildren(child.id));
      });

      return allWidgets;
    };

    const componentWidgets = getWidgetWithChildren(selectedWidget.id);

    const component = {
      id: uuidv4(),
      name: name || `Component ${state.componentLibrary.length + 1}`,
      description: description || '',
      widgets: componentWidgets,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      componentLibrary: [...state.componentLibrary, component],
    }));

    return component.id;
  },

  deleteComponent: (componentId) => {
    set((state) => ({
      componentLibrary: state.componentLibrary.filter(c => c.id !== componentId),
    }));
  },

  insertComponent: (componentId, position) => {
    const component = get().componentLibrary.find(c => c.id === componentId);
    if (!component) return;

    // Generate new IDs for all widgets in the component
    const idMap = new Map();
    component.widgets.forEach(widget => {
      idMap.set(widget.id, uuidv4());
    });

    // Calculate offset based on position
    const minX = Math.min(...component.widgets.map(w => w.props.x));
    const minY = Math.min(...component.widgets.map(w => w.props.y));
    const offsetX = (position?.x || 0) - minX;
    const offsetY = (position?.y || 0) - minY;

    // Clone widgets with new IDs and adjusted positions
    const newWidgets = component.widgets.map(widget => {
      const newId = idMap.get(widget.id);
      const newParentId = widget.parentId ? idMap.get(widget.parentId) : null;

      return {
        ...widget,
        id: newId,
        parentId: newParentId,
        name: `${widget.name}_${Date.now()}`,
        props: {
          ...widget.props,
          x: widget.props.x + offsetX,
          y: widget.props.y + offsetY,
        },
      };
    });

    set((state) => ({
      widgets: [...state.widgets, ...newWidgets],
      selectedWidgetId: newWidgets[0].id,
    }));

    get().saveHistory();
  },

  updateComponent: (componentId, updates) => {
    set((state) => ({
      componentLibrary: state.componentLibrary.map(c =>
        c.id === componentId ? { ...c, ...updates } : c
      ),
    }));
  },

  exportComponentLibrary: () => {
    const state = get();
    return {
      components: state.componentLibrary,
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
    };
  },

  importComponentLibrary: (data) => {
    if (!data.components || !Array.isArray(data.components)) {
      alert('Invalid component library format');
      return;
    }

    set((state) => ({
      componentLibrary: [...state.componentLibrary, ...data.components],
    }));
  },

  // Project operations
  loadProject: (projectData) => {
    if (!Array.isArray(projectData?.pages) || projectData.pages.length === 0) {
      throw new Error('Unsupported project file: no pages found');
    }
    // Load the widgets of the page that becomes current, so that the next
    // savePageWidgets() does not overwrite it with another page's widgets
    const currentPage =
      projectData.pages.find(p => p.id === projectData.currentPageId) || projectData.pages[0];
    set({
      projectName: projectData.projectName || 'Untitled Project',
      pages: projectData.pages,
      currentPageId: currentPage.id,
      widgets: currentPage.widgets || [],
      canvasSize: currentPage.canvasSize || { width: 800, height: 480 },
      assets: projectData.assets || { images: [], fonts: [] },
      componentLibrary: projectData.componentLibrary || [],
      selectedWidgetId: null,
      history: [],
      historyIndex: -1,
    });
    get().saveHistory();
  },

  getProjectData: () => {
    // Save current page before export, then read the updated state:
    // zustand replaces the state object on set(), so a snapshot taken
    // before savePageWidgets() would still hold the old pages.
    get().savePageWidgets();
    const state = get();

    return {
      projectName: state.projectName,
      pages: state.pages,
      currentPageId: state.currentPageId,
      assets: state.assets,
      componentLibrary: state.componentLibrary,
      targetArchitecture: state.targetArchitecture,
      version: '3.0.0',
      createdAt: new Date().toISOString(),
    };
  },

  clearProject: () => {
    set({
      projectName: 'Untitled Project',
      projectPath: null,
      targetArchitecture: DEFAULT_ARCHITECTURE,
      pages: [{
        id: 'page_1',
        name: 'Main Screen',
        widgets: [],
        canvasSize: { width: 1024, height: 600 },
      }],
      currentPageId: 'page_1',
      widgets: [],
      assets: { images: [], fonts: [] },
      componentLibrary: [],
      selectedWidgetId: null,
      history: [],
      historyIndex: -1,
    });
  },

  // Screen templates (v1.2)
  applyTemplate: (templateName) => {
    const templates = {
      'blank': {
        widgets: [],
      },
      'dashboard': {
        widgets: [
          createWidget('panel', uuidv4(), { x: 10, y: 10 }),
          createWidget('label', uuidv4(), { x: 30, y: 30 }),
          createWidget('button', uuidv4(), { x: 10, y: 400 }),
        ],
      },
      'settings': {
        widgets: [
          createWidget('label', uuidv4(), { x: 20, y: 20 }),
          createWidget('switch', uuidv4(), { x: 20, y: 60 }),
          createWidget('slider', uuidv4(), { x: 20, y: 120 }),
        ],
      },
      'list': {
        widgets: [
          createWidget('panel', uuidv4(), { x: 10, y: 10 }),
          createWidget('panel', uuidv4(), { x: 10, y: 110 }),
          createWidget('panel', uuidv4(), { x: 10, y: 210 }),
        ],
      },
    };

    const template = templates[templateName];
    if (template) {
      set({
        widgets: template.widgets,
        selectedWidgetId: null,
      });
      get().saveHistory();
      get().savePageWidgets();
    }
  },

  getAvailableTemplates: () => {
    return [
      { id: 'blank', name: 'Blank Screen', description: 'Empty canvas' },
      { id: 'dashboard', name: 'Dashboard', description: 'Panel with title and button' },
      { id: 'settings', name: 'Settings', description: 'Common settings layout' },
      { id: 'list', name: 'List View', description: 'Vertical list of panels' },
    ];
  },
}));

export default useStore;
