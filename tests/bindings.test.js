import { beforeEach, describe, expect, it } from 'vitest';
import { boundPreviewProps, formatBoundText } from '../src/core/bindings';
import useStore, { selectWidgets } from '../src/core/store';
import { buildProjectCode } from '../src/generators/core/project';
import { allWidgetsProject } from './fixtures/projects';

const store = () => useStore.getState();
const widget = (id) => selectWidgets(store()).find((w) => w.id === id);

describe('binding helpers', () => {
  it('formats integers like LVGL labels', () => {
    expect(formatBoundText('Level: %d', 42)).toBe('Level: 42');
    expect(formatBoundText('%d%% (%i)', 7)).toBe('7% (7)');
    expect(formatBoundText(undefined, 3)).toBe('3');
  });

  it('shows the initial value of the variable on the canvas', () => {
    const variables = [{ id: 'v', name: 'level', initial: 4 }];
    expect(boundPreviewProps({ type: 'slider', binding: { variableId: 'v' } }, { value: 50 }, variables)).toEqual({ value: 4 });
    expect(boundPreviewProps({ type: 'switch', binding: { variableId: 'v' } }, {}, variables)).toEqual({ checked: true });
    expect(boundPreviewProps({ type: 'label', binding: { variableId: 'v', format: 'L%d' } }, {}, variables)).toEqual({ text: 'L4' });
    expect(boundPreviewProps({ type: 'slider', binding: { variableId: 'missing' } }, { value: 50 }, variables)).toEqual({ value: 50 });
  });
});

describe('variables in the store', () => {
  beforeEach(() => store().clearProject());

  it('keeps variable names unique', () => {
    const a = store().addVariable('level', 1);
    store().addVariable('level', 2);
    expect(store().variables.map((v) => v.name)).toEqual(['level', 'level_2']);
    store().updateVariable(a, { name: 'level_2' });
    expect(store().variables[0].name).toBe('level_2_2');
  });

  it('binds only bindable widgets and removes bindings with the variable', () => {
    const variable = store().addVariable('level', 1);
    const slider = store().addWidget('slider', {});
    const panel = store().addWidget('panel', {});
    store().setWidgetBinding(slider, { variableId: variable });
    store().setWidgetBinding(panel, { variableId: variable });
    expect(widget(slider).binding).toEqual({ variableId: variable });
    expect(widget(panel).binding).toBeUndefined();

    store().undo();
    expect(widget(slider).binding).toBeUndefined();
    store().redo();

    store().deleteVariable(variable);
    expect(widget(slider).binding).toBeUndefined();
  });

  it('validates variables and bindings of loaded projects', () => {
    const warnings = store().loadProject({
      variables: [{ id: 'a', name: 'x', initial: '5' }, { id: 'b', name: 'x', initial: 'abc' }],
      pages: [{ id: 'p', name: 'P', canvasSize: { width: 100, height: 100 }, widgets: [
        { id: 's', type: 'slider', name: 's', binding: { variableId: 'a' } },
        { id: 't', type: 'slider', name: 't', binding: { variableId: 'missing' } },
        { id: 'u', type: 'panel', name: 'u', binding: { variableId: 'a' } },
      ] }],
    });
    expect(store().variables).toEqual([{ id: 'a', name: 'x', initial: 5 }, { id: 'b', name: 'x_2', initial: 0 }]);
    expect(widget('s').binding).toEqual({ variableId: 'a' });
    expect(widget('t').binding).toBeUndefined();
    expect(widget('u').binding).toBeUndefined();
    expect(warnings.some((w) => w.includes('missing variable'))).toBe(true);
  });
});

describe('generated bindings', () => {
  it('uses lv_subject_create in C and subject_t in MicroPython', () => {
    const c = buildProjectCode(allWidgetsProject(), 'c');
    expect(c.declarations).toContain('lv_subject_t * var_level;');
    expect(c.declarations).toContain('var_level = lv_subject_create(LV_SUBJECT_TYPE_INT);');
    expect(c.declarations).toContain('lv_subject_set_int(var_level, 3);');
    expect(c.declarations).not.toContain('lv_subject_init');
    const cCode = c.pages[0].widgets.join('\n');
    expect(cCode.trimStart().startsWith('all_widgets_variables_init();')).toBe(true);
    expect(cCode).toContain('lv_slider_bind_value(ui_slider_widget, var_level);');
    expect(cCode).toContain('lv_label_bind_text(ui_label_widget, var_level, "Level: %d");');
    expect(cCode).toContain('lv_obj_bind_checked(ui_switch_widget, var_enabled);');

    const py = buildProjectCode(allWidgetsProject(), 'micropython');
    expect(py.declarations).toContain('var_level = lv.subject_t()\nvar_level.init_int(3)');
    expect(py.pages[0].widgets.join('\n')).toContain('slider_widget.bind_value(var_level)');
  });
});
