import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useStore, {
  HISTORY_COALESCE_MS,
  selectCanRedo,
  selectCanUndo,
  selectCanvasSize,
  selectCurrentPage,
  selectSelectedWidget,
  selectWidgets,
} from '../src/core/store';
import { absolutePosition } from '../src/core/projectModel';

const store = () => useStore.getState();
const widgets = () => selectWidgets(store());
const widget = (id) => widgets().find((w) => w.id === id);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  store().clearProject();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Panel at (100, 50) with a 2px border and 10px left / 5px top padding, containing a label at (10, 20). */
function panelWithLabel() {
  const panel = store().addWidget('panel', { x: 100, y: 50, borderWidth: 2, padLeft: 10, padTop: 5 });
  const label = store().addWidget('label', { x: 0, y: 0 });
  store().setWidgetParent(label, panel);
  store().moveWidget(label, 10, 20);
  return { panel, label };
}

describe('project data', () => {
  it('getProjectData returns the current widgets of every page', () => {
    store().addWidget('button', { x: 10, y: 10 });
    store().addPage('Second');
    store().addWidget('label', { x: 0, y: 0 });

    const pages = store().getProjectData().pages;

    expect(pages.map((p) => p.widgets.map((w) => w.type))).toEqual([['button'], ['label']]);
  });

  it('pages are the only source of truth: switching pages shows their widgets', () => {
    store().addWidget('button', { x: 10, y: 10 });
    const first = store().currentPageId;
    store().addPage('Second');
    expect(widgets()).toHaveLength(0);
    expect(store().selectedWidgetId).toBeNull();
    store().addWidget('label', { x: 0, y: 0 });

    store().switchPage(first);

    expect(widgets().map((w) => w.type)).toEqual(['button']);
    expect(store().selectedWidgetId).toBeNull();
  });

  it('canvas size belongs to the current page', () => {
    store().setCanvasSize({ width: 320, height: 240 });
    store().addPage('Second');
    store().setCanvasSize({ width: 480, height: 272 });

    expect(store().pages.map((p) => p.canvasSize)).toEqual([{ width: 320, height: 240 }, { width: 480, height: 272 }]);
    expect(selectCanvasSize(store())).toEqual({ width: 480, height: 272 });
  });
});

describe('loading projects', () => {
  it('rejects files without pages', () => {
    expect(() => store().loadProject({ projectName: 'Old', widgets: [] })).toThrow(/no pages/);
  });

  it('loads the saved current page and resets the history', () => {
    store().addWidget('button', {});
    const warnings = store().loadProject({
      projectName: 'Saved',
      currentPageId: 'b',
      pages: [
        { id: 'a', name: 'A', canvasSize: { width: 100, height: 100 }, widgets: [] },
        { id: 'b', name: 'B', canvasSize: { width: 200, height: 100 }, widgets: [{ id: 'w1', type: 'label', name: 'l', props: { x: 1, y: 2 } }] },
      ],
    });

    expect(warnings).toEqual([]);
    expect(store().currentPageId).toBe('b');
    expect(widgets()).toHaveLength(1);
    expect(widget('w1').props.text).toBe('Label Text'); // defaults filled in
    expect(selectCanUndo(store())).toBe(false);
  });

  it('repairs invalid content and reports it', () => {
    const warnings = store().loadProject({
      pages: [
        {
          id: 'p',
          name: 'P',
          canvasSize: { width: -1, height: 'x' },
          widgets: [
            { id: 'a', type: 'button', name: 'dup', props: {} },
            { id: 'a', type: 'label', name: 'dup', props: {} },
            { id: 'u', type: 'teleporter', name: 'unknown' },
            { id: 'c1', type: 'panel', name: 'c1', parentId: 'c2' },
            { id: 'c2', type: 'panel', name: 'c2', parentId: 'c1' },
            { id: 'o', type: 'label', name: 'orphan', parentId: 'missing' },
            42,
          ],
        },
      ],
    });

    const ids = widgets().map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(widgets().map((w) => w.type)).not.toContain('teleporter');
    expect(new Set(widgets().map((w) => w.name)).size).toBe(widgets().length);
    expect(widget('o').parentId).toBeNull();
    expect([widget('c1').parentId, widget('c2').parentId]).toContain(null);
    expect(selectCanvasSize(store())).toEqual({ width: 1024, height: 600 });
    expect(warnings.length).toBeGreaterThanOrEqual(6);
  });
});

describe('widgets', () => {
  it('gives new widgets unique names', () => {
    const a = store().addWidget('button', {});
    store().renameWidget(a, 'ok');
    const b = store().addWidget('button', {});
    store().renameWidget(b, 'cancel');
    store().addWidget('button', {});

    expect(new Set(widgets().map((w) => w.name)).size).toBe(3);
  });

  it('renames the widget, not a prop', () => {
    const id = store().addWidget('button', {});
    store().renameWidget(id, 'ok_button');

    expect(widget(id).name).toBe('ok_button');
    expect(widget(id).props.name).toBeUndefined();
  });

  it('deletes a widget with its descendants', () => {
    const { panel, label } = panelWithLabel();
    const other = store().addWidget('button', {});
    store().selectWidget(label);

    store().deleteWidget(panel);

    expect(widgets().map((w) => w.id)).toEqual([other]);
    expect(store().selectedWidgetId).toBeNull();
  });

  it('duplicates a widget with its children, new ids and names', () => {
    const { panel, label } = panelWithLabel();

    const copy = store().duplicateWidget(panel);

    expect(widgets()).toHaveLength(4);
    const copyChild = widgets().find((w) => w.parentId === copy);
    expect(copyChild).toBeDefined();
    expect(copyChild.id).not.toBe(label);
    expect(widget(copy).props.x).toBe(120);
    expect(new Set(widgets().map((w) => w.name)).size).toBe(4);
    expect(selectSelectedWidget(store()).id).toBe(copy);
  });

  it('keeps the screen position when changing parent (LVGL content coordinates)', () => {
    const { panel, label } = panelWithLabel();
    // panel (100,50) + border 2 + padding (10,5) + label (10,20)
    expect(absolutePosition(widgets(), label)).toEqual({ x: 122, y: 77 });

    store().setWidgetParent(label, null);
    expect(widget(label).props).toMatchObject({ x: 122, y: 77 });

    store().setWidgetParent(label, panel);
    expect(widget(label).props).toMatchObject({ x: 10, y: 20 });
  });

  it('refuses parent cycles', () => {
    const { panel, label } = panelWithLabel();

    expect(store().setWidgetParent(panel, label)).toBe(false);
    expect(store().setWidgetParent(panel, panel)).toBe(false);
    expect(widget(panel).parentId).toBeNull();
  });

  it('inserts a component as one undo step with remapped parents', () => {
    const { panel } = panelWithLabel();
    store().selectWidget(panel);
    const componentId = store().saveAsComponent('Card');
    store().addPage('Empty');

    const root = store().insertComponent(componentId, { x: 300, y: 200 });

    expect(widgets()).toHaveLength(2);
    expect(widget(root).props).toMatchObject({ x: 300, y: 200 });
    expect(widgets().find((w) => w.id !== root).parentId).toBe(root);
    store().undo();
    expect(widgets()).toHaveLength(0);
  });
});

describe('history', () => {
  it('groups consecutive edits of the same field into one undo step', () => {
    const id = store().addWidget('label', {});
    'Hello'.split('').forEach((_, i) => {
      vi.advanceTimersByTime(100);
      store().updateWidget(id, { text: 'Hello'.slice(0, i + 1) });
    });

    store().undo();

    expect(widget(id).props.text).toBe('Label Text');
  });

  it('separates edits after a pause or on another field', () => {
    const id = store().addWidget('label', {});
    store().updateWidget(id, { text: 'A' });
    vi.advanceTimersByTime(HISTORY_COALESCE_MS + 1);
    store().updateWidget(id, { text: 'AB' });
    store().updateWidget(id, { textColor: '#ff0000' });

    store().undo();
    expect(widget(id).props).toMatchObject({ text: 'AB', textColor: '#000000' });
    store().undo();
    expect(widget(id).props.text).toBe('A');
  });

  it('records each move separately', () => {
    const id = store().addWidget('button', { x: 0, y: 0 });
    store().moveWidget(id, 10, 10);
    store().moveWidget(id, 20, 20);

    store().undo();

    expect(widget(id).props).toMatchObject({ x: 10, y: 10 });
  });

  it('keeps a separate history for each page', () => {
    store().addWidget('button', {});
    const first = store().currentPageId;
    store().addPage('Second');
    expect(selectCanUndo(store())).toBe(false);
    store().addWidget('label', {});

    store().switchPage(first);
    store().undo();

    expect(widgets()).toHaveLength(0);
    expect(store().pages[1].widgets).toHaveLength(1);
  });

  it('redoes undone changes until a new edit', () => {
    const id = store().addWidget('button', { x: 0, y: 0 });
    store().moveWidget(id, 5, 5);
    store().undo();
    expect(selectCanRedo(store())).toBe(true);

    store().redo();
    expect(widget(id).props.x).toBe(5);

    store().undo();
    store().moveWidget(id, 7, 7);
    expect(selectCanRedo(store())).toBe(false);
  });
});

describe('pages', () => {
  it('cannot delete the last page', () => {
    expect(store().deletePage(store().currentPageId)).toBe(false);
    expect(store().pages).toHaveLength(1);
  });

  it('duplicates a page with new ids and the same hierarchy', () => {
    const { panel, label } = panelWithLabel();
    const copyId = store().duplicatePage(store().currentPageId);
    const copy = store().pages.find((p) => p.id === copyId);

    const copyIds = copy.widgets.map((w) => w.id);
    expect(copyIds).not.toContain(panel);
    expect(copyIds).not.toContain(label);
    const copyPanel = copy.widgets.find((w) => w.type === 'panel');
    expect(copy.widgets.find((w) => w.type === 'label').parentId).toBe(copyPanel.id);
    expect(selectCurrentPage(store()).id).not.toBe(copyId);
  });
});

describe('component library', () => {
  it('imports components, validating their widgets', () => {
    const warnings = store().importComponentLibrary({
      components: [{ name: 'Card', widgets: [{ id: 'x', type: 'nope' }, { id: 'y', type: 'label', props: {} }] }],
    });

    expect(warnings).toHaveLength(1);
    expect(store().componentLibrary[0]).toMatchObject({ name: 'Card', description: '', tags: [] });
    expect(store().componentLibrary[0].widgets.map((w) => w.type)).toEqual(['label']);
  });

  it('rejects files that are not component libraries', () => {
    expect(() => store().importComponentLibrary({})).toThrow();
  });
});
