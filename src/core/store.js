import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createWidget } from './widgetDefinitions';

const useStore = create((set, get) => ({
  // Project state
  projectName: 'Untitled Project',
  projectPath: null,

  // Canvas state
  widgets: [],
  selectedWidgetId: null,
  canvasSize: { width: 800, height: 480 }, // Default LVGL display size
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

  setCanvasSize: (size) => set({ canvasSize: size }),

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

  // Project operations
  loadProject: (projectData) => {
    set({
      projectName: projectData.projectName || 'Untitled Project',
      widgets: projectData.widgets || [],
      canvasSize: projectData.canvasSize || { width: 800, height: 480 },
      selectedWidgetId: null,
      history: [],
      historyIndex: -1,
    });
    get().saveHistory();
  },

  getProjectData: () => {
    const state = get();
    return {
      projectName: state.projectName,
      widgets: state.widgets,
      canvasSize: state.canvasSize,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    };
  },

  clearProject: () => {
    set({
      projectName: 'Untitled Project',
      projectPath: null,
      widgets: [],
      selectedWidgetId: null,
      history: [],
      historyIndex: -1,
    });
  },
}));

export default useStore;
