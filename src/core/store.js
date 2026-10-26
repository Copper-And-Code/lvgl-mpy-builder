import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createWidget } from './widgetDefinitions';
import { DEFAULT_ARCHITECTURE } from '../generators/templateLoader';
import {
  absolutePosition,
  canReparent,
  cloneWithNewIds,
  contentOrigin,
  descendantIds,
  findWidget,
  subtree,
  uniqueName,
  withUniqueNames,
} from './projectModel';
import { DEFAULT_CANVAS_SIZE, validateComponents, validateProject } from './projectValidation';
import { isBindable } from './bindings';

// Consecutive edits with the same key within this time are one undo step
// (typing in a field, dragging a color picker)
export const HISTORY_COALESCE_MS = 1000;
const MAX_HISTORY = 50;

const newPage = (name, canvasSize = DEFAULT_CANVAS_SIZE) => ({
  id: `page_${uuidv4()}`,
  name,
  widgets: [],
  canvasSize: { ...canvasSize },
});

const initialProject = () => {
  const page = { ...newPage('Main Screen'), id: 'page_1' };
  return {
    projectName: 'Untitled Project',
    projectPath: null,
    targetArchitecture: DEFAULT_ARCHITECTURE,
    pages: [page],
    currentPageId: page.id,
    assets: { images: [], fonts: [] },
    componentLibrary: [],
    variables: [], // { id, name, initial }: integer LVGL subjects for data binding
    selectedWidgetId: null,
    history: {},
  };
};

// ---------------------------------------------------------------------------
// Selectors: the pages are the only source of truth

export const selectCurrentPage = (state) =>
  state.pages.find((page) => page.id === state.currentPageId) ?? state.pages[0];
export const selectWidgets = (state) => selectCurrentPage(state).widgets;
export const selectCanvasSize = (state) => selectCurrentPage(state).canvasSize;
export const selectSelectedWidget = (state) =>
  findWidget(selectWidgets(state), state.selectedWidgetId);
export const selectCanUndo = (state) => (state.history[state.currentPageId]?.past.length ?? 0) > 0;
export const selectCanRedo = (state) => (state.history[state.currentPageId]?.future.length ?? 0) > 0;

// ---------------------------------------------------------------------------
// History: one undo/redo stack per page, holding previous widget arrays

function recordHistory(entry, previousWidgets, key, now) {
  const history = entry ?? { past: [], future: [], lastKey: null, lastTime: 0 };
  if (key && history.lastKey === key && now - history.lastTime < HISTORY_COALESCE_MS && history.past.length) {
    return { ...history, future: [], lastTime: now };
  }
  return {
    past: [...history.past, previousWidgets].slice(-MAX_HISTORY),
    future: [],
    lastKey: key ?? null,
    lastTime: now,
  };
}

const replacePage = (pages, pageId, changes) =>
  pages.map((page) => (page.id === pageId ? { ...page, ...changes } : page));

/**
 * State changes that replace the widgets of the current page and record the
 * previous ones in its history. Returns {} when nothing changed.
 */
function editWidgets(state, edit, key = null) {
  const page = selectCurrentPage(state);
  const widgets = edit(page.widgets);
  if (!widgets || widgets === page.widgets) return {};
  return {
    pages: replacePage(state.pages, page.id, { widgets }),
    history: { ...state.history, [page.id]: recordHistory(state.history[page.id], page.widgets, key, Date.now()) },
  };
}

const mapWidget = (widgets, id, change) => {
  if (!findWidget(widgets, id)) return widgets;
  return widgets.map((widget) => (widget.id === id ? change(widget) : widget));
};

// ---------------------------------------------------------------------------

const useStore = create((set, get) => ({
  ...initialProject(),

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

  // Editor state (not part of the project)
  zoom: 1,
  gridEnabled: true,
  snapToGrid: true,
  gridSize: 10,

  setProjectName: (name) => set({ projectName: name }),
  setProjectPath: (path) => set({ projectPath: path }),
  setTargetArchitecture: (architecture) => set({ targetArchitecture: architecture }),

  setCanvasSize: (size) =>
    set((state) => ({
      pages: replacePage(state.pages, state.currentPageId, { canvasSize: { width: size.width, height: size.height } }),
    })),

  applyDisplayPreset: (preset) => get().setCanvasSize(preset),

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  // -------------------------------------------------------------------------
  // Widgets of the current page

  addWidget: (type, position) => {
    const id = uuidv4();
    set((state) => {
      const widgets = selectWidgets(state);
      const widget = createWidget(type, id, position);
      widget.name = uniqueName(widget.name, widgets);
      return { ...editWidgets(state, () => [...widgets, widget]), selectedWidgetId: id };
    });
    return id;
  },

  /** Change widget props; consecutive edits of the same props are one undo step. */
  updateWidget: (id, props) =>
    set((state) =>
      editWidgets(
        state,
        (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, props: { ...widget.props, ...props } })),
        `props:${id}:${Object.keys(props).sort().join(',')}`
      )
    ),

  /** Move a widget (one undo step per call, e.g. per drag). */
  moveWidget: (id, x, y) =>
    set((state) =>
      editWidgets(state, (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, props: { ...widget.props, x, y } })))
    ),

  renameWidget: (id, name) =>
    set((state) => editWidgets(state, (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, name })), `name:${id}`)),

  updateWidgetEvents: (id, events) =>
    set((state) => editWidgets(state, (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, events })), `events:${id}`)),

  updateWidgetAnimations: (id, animations) =>
    set((state) =>
      editWidgets(state, (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, animations: animations || [] })), `animations:${id}`)
    ),

  updateWidgetStyles: (id, styles) =>
    set((state) =>
      editWidgets(state, (widgets) => mapWidget(widgets, id, (widget) => ({ ...widget, customStyles: styles || {} })), `styles:${id}`)
    ),

  /**
   * Change the parent of a widget, keeping it at the same place on the
   * screen (LVGL child coordinates are relative to the parent's content).
   * Returns false if the move would create a cycle.
   */
  setWidgetParent: (id, parentId) => {
    const widgets = selectWidgets(get());
    const widget = findWidget(widgets, id);
    if (!widget || (widget.parentId ?? null) === (parentId ?? null)) return true;
    if (!canReparent(widgets, id, parentId)) return false;
    const position = absolutePosition(widgets, id);
    const origin = contentOrigin(widgets, parentId);
    set((state) =>
      editWidgets(state, (current) =>
        mapWidget(current, id, (w) => ({
          ...w,
          parentId: parentId || null,
          props: { ...w.props, x: position.x - origin.x, y: position.y - origin.y },
        }))
      )
    );
    return true;
  },

  /** Delete a widget together with its children. */
  deleteWidget: (id) =>
    set((state) => {
      const removed = descendantIds(selectWidgets(state), id);
      removed.add(id);
      return {
        ...editWidgets(state, (widgets) => widgets.filter((widget) => !removed.has(widget.id))),
        selectedWidgetId: removed.has(state.selectedWidgetId) ? null : state.selectedWidgetId,
      };
    }),

  selectWidget: (id) => set({ selectedWidgetId: id }),
  deselectWidget: () => set({ selectedWidgetId: null }),

  /** Duplicate a widget with its children, next to the original. */
  duplicateWidget: (id) => {
    const widgets = selectWidgets(get());
    const original = findWidget(widgets, id);
    if (!original) return null;
    const copies = withUniqueNames(cloneWithNewIds(subtree(widgets, id)), widgets, '_copy');
    // The copied root is the only copy without a parent inside the copied set
    const root = copies.find((widget) => !widget.parentId);
    root.parentId = original.parentId ?? null;
    root.props = { ...root.props, x: (root.props.x ?? 0) + 20, y: (root.props.y ?? 0) + 20 };
    set((state) => ({ ...editWidgets(state, (current) => [...current, ...copies]), selectedWidgetId: root.id }));
    return root.id;
  },

  moveWidgetToFront: (id) =>
    set((state) =>
      editWidgets(state, (widgets) => {
        const widget = findWidget(widgets, id);
        return widget ? [...widgets.filter((w) => w.id !== id), widget] : widgets;
      })
    ),

  moveWidgetToBack: (id) =>
    set((state) =>
      editWidgets(state, (widgets) => {
        const widget = findWidget(widgets, id);
        return widget ? [widget, ...widgets.filter((w) => w.id !== id)] : widgets;
      })
    ),

  /**
   * Insert copies of `widgets` (a component or a template) as one undo step.
   * The top-left corner of the top-level widgets is placed at `position`.
   */
  insertWidgets: (widgets, position = { x: 50, y: 50 }) => {
    if (!Array.isArray(widgets) || widgets.length === 0) return null;
    const current = selectWidgets(get());
    const copies = withUniqueNames(cloneWithNewIds(widgets), current);
    const roots = copies.filter((widget) => !widget.parentId);
    const minX = Math.min(...roots.map((widget) => widget.props.x ?? 0));
    const minY = Math.min(...roots.map((widget) => widget.props.y ?? 0));
    roots.forEach((widget) => {
      widget.props = { ...widget.props, x: (widget.props.x ?? 0) - minX + position.x, y: (widget.props.y ?? 0) - minY + position.y };
    });
    set((state) => ({ ...editWidgets(state, (existing) => [...existing, ...copies]), selectedWidgetId: roots[0]?.id ?? null }));
    return roots[0]?.id ?? null;
  },

  // -------------------------------------------------------------------------
  // History of the current page

  undo: () =>
    set((state) => {
      const page = selectCurrentPage(state);
      const history = state.history[page.id];
      if (!history?.past.length) return {};
      const previous = history.past[history.past.length - 1];
      return {
        pages: replacePage(state.pages, page.id, { widgets: previous }),
        history: {
          ...state.history,
          [page.id]: { past: history.past.slice(0, -1), future: [page.widgets, ...history.future], lastKey: null, lastTime: 0 },
        },
        selectedWidgetId: findWidget(previous, state.selectedWidgetId) ? state.selectedWidgetId : null,
      };
    }),

  redo: () =>
    set((state) => {
      const page = selectCurrentPage(state);
      const history = state.history[page.id];
      if (!history?.future.length) return {};
      const [next, ...future] = history.future;
      return {
        pages: replacePage(state.pages, page.id, { widgets: next }),
        history: {
          ...state.history,
          [page.id]: { past: [...history.past, page.widgets], future, lastKey: null, lastTime: 0 },
        },
        selectedWidgetId: findWidget(next, state.selectedWidgetId) ? state.selectedWidgetId : null,
      };
    }),

  // -------------------------------------------------------------------------
  // Pages

  addPage: (name) => {
    const state = get();
    const page = newPage(name || `Page ${state.pages.length + 1}`, selectCanvasSize(state));
    set({ pages: [...state.pages, page], currentPageId: page.id, selectedWidgetId: null });
    return page.id;
  },

  /** Delete a page; the last page cannot be deleted (returns false). */
  deletePage: (pageId) => {
    const state = get();
    const index = state.pages.findIndex((page) => page.id === pageId);
    if (index === -1 || state.pages.length <= 1) return false;
    const pages = state.pages.filter((page) => page.id !== pageId);
    const currentPageId = pageId === state.currentPageId ? pages[Math.max(index - 1, 0)].id : state.currentPageId;
    const history = { ...state.history };
    delete history[pageId];
    set({
      pages,
      currentPageId,
      history,
      selectedWidgetId: pageId === state.currentPageId ? null : state.selectedWidgetId,
    });
    return true;
  },

  renamePage: (pageId, name) => set((state) => ({ pages: replacePage(state.pages, pageId, { name }) })),

  switchPage: (pageId) => {
    if (pageId === get().currentPageId || !get().pages.some((page) => page.id === pageId)) return;
    set({ currentPageId: pageId, selectedWidgetId: null });
  },

  duplicatePage: (pageId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return null;
    const copy = { ...newPage(`${page.name} (Copy)`, page.canvasSize), widgets: cloneWithNewIds(page.widgets) };
    const index = state.pages.indexOf(page);
    set({ pages: [...state.pages.slice(0, index + 1), copy, ...state.pages.slice(index + 1)] });
    return copy.id;
  },

  /**
   * Bind a widget to a variable ({ variableId, format? }) or remove the
   * binding (null). Only bindable widget types accept a binding.
   */
  setWidgetBinding: (id, binding) =>
    set((state) =>
      editWidgets(
        state,
        (widgets) => {
          const widget = findWidget(widgets, id);
          // Nothing to change: no new undo step
          if (!widget || (binding ? !isBindable(widget.type) : !widget.binding)) return widgets;
          return mapWidget(widgets, id, (w) => {
            if (!binding) {
              const { binding: _removed, ...rest } = w;
              return rest;
            }
            return { ...w, binding: { ...binding } };
          });
        },
        `binding:${id}`
      )
    ),

  // -------------------------------------------------------------------------
  // Variables (data binding)

  /** Add an integer variable; returns its id. */
  addVariable: (name = 'value', initial = 0) => {
    const id = uuidv4();
    set((state) => ({
      variables: [...state.variables, { id, name: uniqueName(name, state.variables), initial: Math.round(Number(initial) || 0) }],
    }));
    return id;
  },

  updateVariable: (id, changes) =>
    set((state) => ({
      variables: state.variables.map((variable) => {
        if (variable.id !== id) return variable;
        const next = { ...variable };
        if (changes.name !== undefined) {
          next.name = uniqueName(changes.name, state.variables.filter((v) => v.id !== id)) || variable.name;
        }
        if (changes.initial !== undefined) next.initial = Math.round(Number(changes.initial) || 0);
        return next;
      }),
    })),

  /** Delete a variable and the bindings that use it, on every page. */
  deleteVariable: (id) =>
    set((state) => ({
      variables: state.variables.filter((variable) => variable.id !== id),
      pages: state.pages.map((page) => {
        if (!page.widgets.some((widget) => widget.binding?.variableId === id)) return page;
        return {
          ...page,
          widgets: page.widgets.map((widget) => {
            if (widget.binding?.variableId !== id) return widget;
            const { binding: _removed, ...rest } = widget;
            return rest;
          }),
        };
      }),
    })),

  // -------------------------------------------------------------------------
  // Assets

  /** Add an asset; its name is made unique, since widgets refer to images by name. */
  addAsset: (type, asset) =>
    set((state) => ({
      assets: {
        ...state.assets,
        [type]: [...state.assets[type], { ...asset, id: uuidv4(), name: uniqueName(asset.name, state.assets[type]) }],
      },
    })),

  /** Change editable fields of an asset (e.g. the extra characters of a font). */
  updateAsset: (type, assetId, changes) =>
    set((state) => ({
      assets: {
        ...state.assets,
        [type]: state.assets[type].map((asset) => (asset.id === assetId ? { ...asset, ...changes, id: asset.id, name: asset.name } : asset)),
      },
    })),

  removeAsset: (type, assetId) =>
    set((state) => ({
      assets: { ...state.assets, [type]: state.assets[type].filter((asset) => asset.id !== assetId) },
    })),

  getAsset: (type, assetId) => get().assets[type].find((asset) => asset.id === assetId),

  // -------------------------------------------------------------------------
  // Component library

  /** Save the selected widget and its children as a component; returns its id or null. */
  saveAsComponent: (name, description, tags = []) => {
    const state = get();
    const selected = selectSelectedWidget(state);
    if (!selected) return null;
    const widgets = subtree(selectWidgets(state), selected.id).map((widget) =>
      widget.id === selected.id ? { ...widget, parentId: null } : widget
    );
    const component = {
      id: uuidv4(),
      name: name || `Component ${state.componentLibrary.length + 1}`,
      description: description || '',
      widgets,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };
    set({ componentLibrary: [...state.componentLibrary, component] });
    return component.id;
  },

  deleteComponent: (componentId) =>
    set((state) => ({ componentLibrary: state.componentLibrary.filter((c) => c.id !== componentId) })),

  insertComponent: (componentId, position) => {
    const component = get().componentLibrary.find((c) => c.id === componentId);
    return component ? get().insertWidgets(component.widgets, position) : null;
  },

  updateComponent: (componentId, updates) =>
    set((state) => ({
      componentLibrary: state.componentLibrary.map((c) => (c.id === componentId ? { ...c, ...updates } : c)),
    })),

  exportComponentLibrary: () => ({
    components: get().componentLibrary,
    exportedAt: new Date().toISOString(),
  }),

  /**
   * Add the components of a library file; returns the validation warnings.
   * @throws {Error} if the file is not a component library
   */
  importComponentLibrary: (data) => {
    if (!Array.isArray(data?.components)) throw new Error('Invalid component library format');
    const warnings = [];
    const components = validateComponents(data.components, warnings).map((component) => ({ ...component, id: uuidv4() }));
    set((state) => ({ componentLibrary: [...state.componentLibrary, ...components] }));
    return warnings;
  },

  // -------------------------------------------------------------------------
  // Project

  /**
   * Load a project file; returns the validation warnings.
   * @throws {Error} if the file is not a project
   */
  loadProject: (data) => {
    const { project, warnings } = validateProject(data);
    set({
      ...initialProject(),
      ...project,
      targetArchitecture: project.targetArchitecture ?? get().targetArchitecture,
    });
    return warnings;
  },

  getProjectData: () => {
    const state = get();
    return {
      projectName: state.projectName,
      pages: state.pages,
      currentPageId: state.currentPageId,
      assets: state.assets,
      componentLibrary: state.componentLibrary,
      variables: state.variables,
      targetArchitecture: state.targetArchitecture,
      version: '4.0.0',
      createdAt: new Date().toISOString(),
    };
  },

  clearProject: () => set(initialProject()),

  // -------------------------------------------------------------------------
  // Screen templates: replace the widgets of the current page (one undo step)

  applyTemplate: (templateName) => {
    const templates = {
      blank: [],
      dashboard: [
        createWidget('panel', uuidv4(), { x: 10, y: 10 }),
        createWidget('label', uuidv4(), { x: 30, y: 30 }),
        createWidget('button', uuidv4(), { x: 10, y: 400 }),
      ],
      settings: [
        createWidget('label', uuidv4(), { x: 20, y: 20 }),
        createWidget('switch', uuidv4(), { x: 20, y: 60 }),
        createWidget('slider', uuidv4(), { x: 20, y: 120 }),
      ],
      list: [
        createWidget('panel', uuidv4(), { x: 10, y: 10 }),
        createWidget('panel', uuidv4(), { x: 10, y: 110 }),
        createWidget('panel', uuidv4(), { x: 10, y: 210 }),
      ],
    };
    const widgets = templates[templateName];
    if (!widgets) return;
    set((state) => ({ ...editWidgets(state, () => withUniqueNames(widgets, [])), selectedWidgetId: null }));
  },

  getAvailableTemplates: () => [
    { id: 'blank', name: 'Blank Screen', description: 'Empty canvas' },
    { id: 'dashboard', name: 'Dashboard', description: 'Panel with title and button' },
    { id: 'settings', name: 'Settings', description: 'Common settings layout' },
    { id: 'list', name: 'List View', description: 'Vertical list of panels' },
  ],
}));

export default useStore;
