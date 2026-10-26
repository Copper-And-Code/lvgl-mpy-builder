import { describe, expect, it } from 'vitest';
import {
  absolutePosition,
  canReparent,
  childrenByParent,
  cloneWithNewIds,
  contentOffset,
  contentOrigin,
  uniqueName,
} from '../src/core/projectModel';
import { generateCCode } from '../src/generators/cGenerator';

const w = (id, parentId, props = {}, extra = {}) => ({ id, type: 'panel', name: id, parentId, props: { x: 0, y: 0, ...props }, ...extra });

describe('projectModel', () => {
  const widgets = [
    w('root', null, { x: 100, y: 50, borderWidth: 2, padLeft: 10, padTop: 5 }),
    w('child', 'root', { x: 10, y: 20, borderWidth: 1 }, { customStyles: { pad_left: 3, pad_top: 4, border_width: 0 } }),
    w('grandchild', 'child', { x: 1, y: 1 }),
    w('orphan', 'missing', { x: 7, y: 7 }),
  ];

  it('uses border and padding (including custom styles) as content offset', () => {
    expect(contentOffset(widgets[0])).toEqual({ x: 12, y: 7 });
    expect(contentOffset(widgets[1])).toEqual({ x: 3, y: 4 });
  });

  it('computes canvas positions through the hierarchy', () => {
    expect(absolutePosition(widgets, 'child')).toEqual({ x: 122, y: 77 });
    expect(absolutePosition(widgets, 'grandchild')).toEqual({ x: 126, y: 82 });
    expect(contentOrigin(widgets, 'child')).toEqual({ x: 125, y: 81 });
    expect(contentOrigin(widgets, null)).toEqual({ x: 0, y: 0 });
  });

  it('treats widgets with a missing parent as top-level', () => {
    expect(childrenByParent(widgets).get(null).map((x) => x.id)).toEqual(['root', 'orphan']);
  });

  it('prevents cycles', () => {
    expect(canReparent(widgets, 'root', 'grandchild')).toBe(false);
    expect(canReparent(widgets, 'grandchild', 'root')).toBe(true);
    expect(canReparent(widgets, 'root', 'root')).toBe(false);
  });

  it('clones with new ids and keeps the internal hierarchy', () => {
    const copies = cloneWithNewIds(widgets.slice(1, 3));
    expect(copies[0].parentId).toBeNull();
    expect(copies[1].parentId).toBe(copies[0].id);
    expect(copies.map((c) => c.id)).not.toContain('child');
  });

  it('makes names unique', () => {
    expect(uniqueName('root', widgets)).toBe('root_2');
    expect(uniqueName('free', widgets)).toBe('free');
  });
});

describe('generated padding matches the canvas', () => {
  it('emits the panel padding also when it is 0, so the theme padding does not apply', async () => {
    const project = {
      projectName: 'pad',
      pages: [{ id: 'p', name: 'Main', canvasSize: { width: 100, height: 100 }, widgets: [
        { id: 'a', type: 'panel', name: 'zero', props: { x: 0, y: 0, width: 50, height: 50, padTop: 0, padBottom: 0, padLeft: 0, padRight: 0, padRow: 0, padColumn: 0 } },
        { id: 'b', type: 'panel', name: 'mixed', props: { x: 0, y: 0, width: 50, height: 50, padTop: 1, padBottom: 2, padLeft: 0, padRight: 0 } },
      ] }],
    };
    const code = await generateCCode(project, 'unix');
    expect(code).toContain('lv_obj_set_style_pad_all(ui_zero, 0, LV_PART_MAIN);');
    expect(code).toContain('lv_obj_set_style_pad_gap(ui_zero, 0, LV_PART_MAIN);');
    expect(code).toContain('lv_obj_set_style_pad_top(ui_mixed, 1, LV_PART_MAIN);');
    expect(code).toContain('lv_obj_set_style_pad_left(ui_mixed, 0, LV_PART_MAIN);');
  });
});
