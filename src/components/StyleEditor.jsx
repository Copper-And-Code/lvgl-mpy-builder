import React, { useState } from 'react';
import '../styles/StyleEditor.css';

// Common LVGL style properties
const STYLE_PROPERTIES = {
  // Background
  bg_color: { label: 'Background Color', type: 'color', default: '#FFFFFF' },
  bg_opa: { label: 'Background Opacity', type: 'number', min: 0, max: 255, default: 255 },

  // Border
  border_color: { label: 'Border Color', type: 'color', default: '#000000' },
  border_width: { label: 'Border Width', type: 'number', min: 0, max: 20, default: 0 },
  border_opa: { label: 'Border Opacity', type: 'number', min: 0, max: 255, default: 255 },

  // Padding
  pad_top: { label: 'Padding Top', type: 'number', min: 0, max: 50, default: 0 },
  pad_bottom: { label: 'Padding Bottom', type: 'number', min: 0, max: 50, default: 0 },
  pad_left: { label: 'Padding Left', type: 'number', min: 0, max: 50, default: 0 },
  pad_right: { label: 'Padding Right', type: 'number', min: 0, max: 50, default: 0 },

  // Text
  text_color: { label: 'Text Color', type: 'color', default: '#000000' },
  text_font_size: { label: 'Text Font Size', type: 'number', min: 8, max: 48, default: 14 },

  // Radius
  radius: { label: 'Border Radius', type: 'number', min: 0, max: 100, default: 0 },

  // Shadow
  shadow_width: { label: 'Shadow Width', type: 'number', min: 0, max: 20, default: 0 },
  shadow_ofs_x: { label: 'Shadow Offset X', type: 'number', min: -20, max: 20, default: 0 },
  shadow_ofs_y: { label: 'Shadow Offset Y', type: 'number', min: -20, max: 20, default: 0 },
  shadow_color: { label: 'Shadow Color', type: 'color', default: '#000000' },
};

const StyleEditor = ({ widget, onUpdateStyles }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const customStyles = widget.customStyles || {};

  const handleStyleChange = (property, value) => {
    const updatedStyles = {
      ...customStyles,
      [property]: value,
    };
    onUpdateStyles(updatedStyles);
  };

  const handleRemoveStyle = (property) => {
    const updatedStyles = { ...customStyles };
    delete updatedStyles[property];
    onUpdateStyles(updatedStyles);
  };

  const handleClearAllStyles = () => {
    onUpdateStyles({});
  };

  const renderStyleInput = (property, config) => {
    const value = customStyles[property];
    const hasValue = value !== undefined;

    if (config.type === 'color') {
      return (
        <div key={property} className="style-field">
          <div className="style-field-header">
            <label>{config.label}</label>
            {hasValue && (
              <button
                className="btn-remove-style"
                onClick={() => handleRemoveStyle(property)}
                title="Remove style"
              >
                ×
              </button>
            )}
          </div>
          <div className="color-input">
            <input
              type="color"
              value={value || config.default}
              onChange={(e) => handleStyleChange(property, e.target.value)}
            />
            <input
              type="text"
              value={value || config.default}
              onChange={(e) => handleStyleChange(property, e.target.value)}
              className="color-text"
            />
          </div>
        </div>
      );
    }

    if (config.type === 'number') {
      return (
        <div key={property} className="style-field">
          <div className="style-field-header">
            <label>{config.label}</label>
            {hasValue && (
              <button
                className="btn-remove-style"
                onClick={() => handleRemoveStyle(property)}
                title="Remove style"
              >
                ×
              </button>
            )}
          </div>
          <input
            type="number"
            value={value !== undefined ? value : config.default}
            onChange={(e) => handleStyleChange(property, parseInt(e.target.value) || 0)}
            min={config.min}
            max={config.max}
          />
        </div>
      );
    }

    return null;
  };

  const activeStylesCount = Object.keys(customStyles).length;

  return (
    <div className="style-editor">
      <div className="style-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Custom Styles ({activeStylesCount})</h4>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="style-content">
          {activeStylesCount > 0 && (
            <button className="btn-clear-styles" onClick={handleClearAllStyles}>
              Clear All Styles
            </button>
          )}

          <div className="style-categories">
            <div className="style-category">
              <h5>Background</h5>
              {renderStyleInput('bg_color', STYLE_PROPERTIES.bg_color)}
              {renderStyleInput('bg_opa', STYLE_PROPERTIES.bg_opa)}
            </div>

            <div className="style-category">
              <h5>Border</h5>
              {renderStyleInput('border_color', STYLE_PROPERTIES.border_color)}
              {renderStyleInput('border_width', STYLE_PROPERTIES.border_width)}
              {renderStyleInput('border_opa', STYLE_PROPERTIES.border_opa)}
              {renderStyleInput('radius', STYLE_PROPERTIES.radius)}
            </div>

            <div className="style-category">
              <h5>Padding</h5>
              <div className="padding-grid">
                {renderStyleInput('pad_top', STYLE_PROPERTIES.pad_top)}
                {renderStyleInput('pad_bottom', STYLE_PROPERTIES.pad_bottom)}
                {renderStyleInput('pad_left', STYLE_PROPERTIES.pad_left)}
                {renderStyleInput('pad_right', STYLE_PROPERTIES.pad_right)}
              </div>
            </div>

            <div className="style-category">
              <h5>Text</h5>
              {renderStyleInput('text_color', STYLE_PROPERTIES.text_color)}
              {renderStyleInput('text_font_size', STYLE_PROPERTIES.text_font_size)}
            </div>

            <div className="style-category">
              <h5>Shadow</h5>
              {renderStyleInput('shadow_width', STYLE_PROPERTIES.shadow_width)}
              {renderStyleInput('shadow_ofs_x', STYLE_PROPERTIES.shadow_ofs_x)}
              {renderStyleInput('shadow_ofs_y', STYLE_PROPERTIES.shadow_ofs_y)}
              {renderStyleInput('shadow_color', STYLE_PROPERTIES.shadow_color)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleEditor;
