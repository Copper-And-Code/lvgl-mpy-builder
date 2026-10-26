import { beforeEach, describe, expect, it } from 'vitest';
import useStore from '../src/core/store';

const store = () => useStore.getState();

describe('store: project data', () => {
  beforeEach(() => {
    store().clearProject();
  });

  it('getProjectData includes widgets added to the current page', () => {
    store().addWidget('button', { x: 10, y: 10 });

    const data = store().getProjectData();

    expect(store().widgets).toHaveLength(1);
    expect(data.pages[0].widgets).toHaveLength(1);
    expect(data.pages[0].widgets[0].type).toBe('button');
  });

  it('getProjectData reflects edits made after the last page switch', () => {
    store().addWidget('label', { x: 0, y: 0 });
    store().getProjectData();
    store().addWidget('slider', { x: 0, y: 50 });

    const types = store().getProjectData().pages[0].widgets.map((w) => w.type);

    expect(types).toEqual(['label', 'slider']);
  });
});

describe('store: pages', () => {
  beforeEach(() => {
    store().clearProject();
  });

  it('addPage starts an empty page and keeps the previous page widgets', () => {
    store().addWidget('button', { x: 10, y: 10 });
    const firstPageId = store().currentPageId;

    store().addPage('Second');

    expect(store().widgets).toHaveLength(0);
    expect(store().selectedWidgetId).toBeNull();
    expect(store().pages.find((p) => p.id === firstPageId).widgets).toHaveLength(1);
  });

  it('switching pages does not copy widgets between pages', () => {
    store().addWidget('button', { x: 10, y: 10 });
    const firstPageId = store().currentPageId;
    store().addPage('Second');
    const secondPageId = store().currentPageId;
    store().addWidget('label', { x: 0, y: 0 });
    store().addWidget('label', { x: 0, y: 40 });

    store().switchPage(firstPageId);
    expect(store().widgets.map((w) => w.type)).toEqual(['button']);

    store().switchPage(secondPageId);
    expect(store().widgets.map((w) => w.type)).toEqual(['label', 'label']);

    const pages = store().getProjectData().pages;
    expect(pages.find((p) => p.id === firstPageId).widgets).toHaveLength(1);
    expect(pages.find((p) => p.id === secondPageId).widgets).toHaveLength(2);
  });

  it('loadProject rejects files without pages', () => {
    expect(() => store().loadProject({ projectName: 'Old', widgets: [] })).toThrow(/no pages/);
  });

  it('loadProject loads the widgets of the saved current page', () => {
    const project = {
      projectName: 'Saved',
      currentPageId: 'b',
      pages: [
        { id: 'a', name: 'A', canvasSize: { width: 100, height: 100 }, widgets: [] },
        {
          id: 'b',
          name: 'B',
          canvasSize: { width: 200, height: 100 },
          widgets: [{ id: 'w1', type: 'label', name: 'l', props: { x: 0, y: 0 }, events: [] }],
        },
      ],
    };

    store().loadProject(project);

    expect(store().currentPageId).toBe('b');
    expect(store().widgets).toHaveLength(1);
    expect(store().canvasSize).toEqual({ width: 200, height: 100 });
    // Saving again must not move page B's widgets onto page A
    const pages = store().getProjectData().pages;
    expect(pages.find((p) => p.id === 'a').widgets).toHaveLength(0);
    expect(pages.find((p) => p.id === 'b').widgets).toHaveLength(1);
  });
});
