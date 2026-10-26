import useStore from '../core/store';
import { widgetDefinitions, WIDGET_TYPES } from '../core/widgetDefinitions';

const WidgetPalette = () => {
  const addWidget = useStore((state) => state.addWidget);

  const handleAddWidget = (type) => {
    addWidget(type, { x: 100, y: 100 });
  };

  const widgetCategories = [
    {
      name: 'Basic',
      widgets: [WIDGET_TYPES.BUTTON, WIDGET_TYPES.LABEL, WIDGET_TYPES.PANEL],
    },
    {
      name: 'Input',
      widgets: [
        WIDGET_TYPES.SLIDER, WIDGET_TYPES.SWITCH, WIDGET_TYPES.CHECKBOX,
        WIDGET_TYPES.TEXTAREA, WIDGET_TYPES.DROPDOWN, WIDGET_TYPES.ROLLER,
        WIDGET_TYPES.SPINBOX, WIDGET_TYPES.KEYBOARD,
      ],
    },
    {
      name: 'Display',
      widgets: [WIDGET_TYPES.BAR, WIDGET_TYPES.ARC, WIDGET_TYPES.SPINNER, WIDGET_TYPES.LED],
    },
    {
      name: 'Data',
      widgets: [WIDGET_TYPES.CHART, WIDGET_TYPES.TABLE, WIDGET_TYPES.SCALE],
    },
    {
      name: 'Media',
      widgets: [WIDGET_TYPES.IMAGE, WIDGET_TYPES.IMAGE_BUTTON],
    },
    {
      name: 'Navigation',
      widgets: [WIDGET_TYPES.TABVIEW, WIDGET_TYPES.TILEVIEW, WIDGET_TYPES.MENU, WIDGET_TYPES.WIN],
    },
    {
      name: 'Container',
      widgets: [
        WIDGET_TYPES.LIST, WIDGET_TYPES.MSGBOX, WIDGET_TYPES.BUTTONMATRIX,
        WIDGET_TYPES.CALENDAR, WIDGET_TYPES.LINE, WIDGET_TYPES.SPAN,
      ],
    },
  ];

  return (
    <div className="widget-palette">
      <h3>Widgets <span style={{ fontSize: '10px', color: '#888' }} title="C: LVGL 9.6 · MicroPython: lv_micropython (LVGL 9.3)">LVGL 9</span></h3>

      {widgetCategories.map((category) => (
        <div key={category.name} className="widget-category">
          <h4>{category.name}</h4>
          <div className="widget-grid">
            {category.widgets.map((type) => {
              const def = widgetDefinitions[type];
              if (!def) return null;
              return (
                <button
                  key={type}
                  className="widget-button"
                  onClick={() => handleAddWidget(type)}
                  title={`Add ${def.name} (${def.lvglType})`}
                >
                  <span className="widget-icon">{def.icon}</span>
                  <span className="widget-name">{def.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="palette-footer">
        <p className="help-text">Click to add widgets to the canvas</p>
        <p className="help-text" style={{ fontSize: '10px', color: '#aaa' }}>31 widget types available</p>
      </div>
    </div>
  );
};

export default WidgetPalette;
