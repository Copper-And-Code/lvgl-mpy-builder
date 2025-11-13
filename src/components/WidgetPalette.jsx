import React from 'react';
import useStore from '../core/store';
import { widgetDefinitions, WIDGET_TYPES } from '../core/widgetDefinitions';

const WidgetPalette = () => {
  const { addWidget } = useStore();

  const handleAddWidget = (type) => {
    // Add widget at a default position
    addWidget(type, { x: 100, y: 100 });
  };

  const widgetCategories = [
    {
      name: 'Basic',
      widgets: [WIDGET_TYPES.BUTTON, WIDGET_TYPES.LABEL, WIDGET_TYPES.PANEL],
    },
    {
      name: 'Input',
      widgets: [WIDGET_TYPES.SLIDER, WIDGET_TYPES.SWITCH, WIDGET_TYPES.CHECKBOX, WIDGET_TYPES.TEXTAREA],
    },
    {
      name: 'Display',
      widgets: [WIDGET_TYPES.BAR, WIDGET_TYPES.ARC, WIDGET_TYPES.SPINNER],
    },
  ];

  return (
    <div className="widget-palette">
      <h3>Widgets</h3>

      {widgetCategories.map((category) => (
        <div key={category.name} className="widget-category">
          <h4>{category.name}</h4>
          <div className="widget-grid">
            {category.widgets.map((type) => {
              const def = widgetDefinitions[type];
              return (
                <button
                  key={type}
                  className="widget-button"
                  onClick={() => handleAddWidget(type)}
                  title={`Add ${def.name}`}
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
      </div>
    </div>
  );
};

export default WidgetPalette;
