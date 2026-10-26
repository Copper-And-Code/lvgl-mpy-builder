import { useShallow } from 'zustand/react/shallow';
import useStore, { selectSelectedWidget } from '../core/store';
import { widgetDefinitions } from '../core/widgetDefinitions';
import EventEditor from './EventEditor';
import AnimationEditor from './AnimationEditor';
import StyleEditor from './StyleEditor';

const PropertiesPanel = () => {
  const selectedWidget = useStore(selectSelectedWidget);
  const imageAssets = useStore((state) => state.assets.images);
  const { updateWidget, renameWidget, updateWidgetEvents, updateWidgetAnimations, updateWidgetStyles, deleteWidget, duplicateWidget } = useStore(
    useShallow((state) => ({
      updateWidget: state.updateWidget,
      renameWidget: state.renameWidget,
      updateWidgetEvents: state.updateWidgetEvents,
      updateWidgetAnimations: state.updateWidgetAnimations,
      updateWidgetStyles: state.updateWidgetStyles,
      deleteWidget: state.deleteWidget,
      duplicateWidget: state.duplicateWidget,
    }))
  );

  if (!selectedWidget) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <p className="no-selection">No widget selected</p>
      </div>
    );
  }

  const definition = widgetDefinitions[selectedWidget.type];

  const handlePropertyChange = (propName, value) => {
    updateWidget(selectedWidget.id, { [propName]: value });
  };

  const renderPropertyInput = (property) => {
    const { name, type, label, options } = property;
    const value = selectedWidget.props[name];

    switch (type) {
      case 'number':
        return (
          <div key={name} className="property-field">
            <label>{label}</label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) => handlePropertyChange(name, parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case 'string':
        return (
          <div key={name} className="property-field">
            <label>{label}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handlePropertyChange(name, e.target.value)}
            />
          </div>
        );

      case 'image':
        // Name of an image of the Asset Manager (embedded in the code) or a file path
        return (
          <div key={name} className="property-field">
            <label>{label}</label>
            <input
              type="text"
              list="asset-image-names"
              value={value || ''}
              placeholder="Image from the Asset Manager or file path"
              onChange={(e) => handlePropertyChange(name, e.target.value)}
            />
            <datalist id="asset-image-names">
              {imageAssets.map((asset) => (
                <option key={asset.id} value={asset.name} />
              ))}
            </datalist>
          </div>
        );

      case 'color':
        return (
          <div key={name} className="property-field">
            <label>{label}</label>
            <div className="color-input">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => handlePropertyChange(name, e.target.value)}
              />
              <input
                type="text"
                value={value || '#000000'}
                onChange={(e) => handlePropertyChange(name, e.target.value)}
                className="color-text"
              />
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={name} className="property-field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handlePropertyChange(name, e.target.checked)}
              />
              {label}
            </label>
          </div>
        );

      case 'select':
        return (
          <div key={name} className="property-field">
            <label>{label}</label>
            <select
              value={value || options[0]}
              onChange={(e) => handlePropertyChange(name, e.target.value)}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="properties-panel">
      <h3>Properties</h3>

      <div className="widget-info">
        <div className="property-field">
          <label>Widget Type</label>
          <input type="text" value={definition.name} disabled />
        </div>

        <div className="property-field">
          <label>Widget ID</label>
          <input
            type="text"
            value={selectedWidget.name}
            onChange={(e) => renameWidget(selectedWidget.id, e.target.value)}
          />
        </div>
      </div>

      <div className="properties-list">
        {definition.properties.map((prop) => renderPropertyInput(prop))}
      </div>

      <EventEditor
        widget={selectedWidget}
        onUpdateEvents={(events) => updateWidgetEvents(selectedWidget.id, events)}
      />

      <AnimationEditor
        widget={selectedWidget}
        onUpdateAnimations={(animations) => updateWidgetAnimations(selectedWidget.id, animations)}
      />

      <StyleEditor
        widget={selectedWidget}
        onUpdateStyles={(styles) => updateWidgetStyles(selectedWidget.id, styles)}
      />

      <div className="widget-actions">
        <button
          className="btn-secondary"
          onClick={() => duplicateWidget(selectedWidget.id)}
        >
          Duplicate
        </button>
        <button
          className="btn-danger"
          onClick={() => deleteWidget(selectedWidget.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
