import React from 'react';
import useStore from '../core/store';
import { widgetDefinitions } from '../core/widgetDefinitions';
import '../styles/HierarchyPanel.css';

const HierarchyPanel = () => {
  const { widgets, selectedWidgetId, selectWidget, updateWidgetParent, moveWidgetToFront, moveWidgetToBack } = useStore();

  // Build hierarchy tree
  const buildTree = () => {
    const rootWidgets = widgets.filter(w => !w.parentId);
    const widgetMap = {};

    widgets.forEach(w => {
      widgetMap[w.id] = { ...w, children: [] };
    });

    widgets.forEach(w => {
      if (w.parentId && widgetMap[w.parentId]) {
        widgetMap[w.parentId].children.push(widgetMap[w.id]);
      }
    });

    return rootWidgets.map(w => widgetMap[w.id]);
  };

  const handleDragStart = (e, widgetId) => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidgetId) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedWidgetId = e.dataTransfer.getData('widgetId');

    if (draggedWidgetId && draggedWidgetId !== targetWidgetId) {
      // Check if target is not a descendant of dragged widget
      const isDescendant = (parentId, childId) => {
        const widget = widgets.find(w => w.id === childId);
        if (!widget || !widget.parentId) return false;
        if (widget.parentId === parentId) return true;
        return isDescendant(parentId, widget.parentId);
      };

      if (!isDescendant(draggedWidgetId, targetWidgetId)) {
        updateWidgetParent(draggedWidgetId, targetWidgetId);
      }
    }
  };

  const handleDropOnRoot = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedWidgetId = e.dataTransfer.getData('widgetId');
    if (draggedWidgetId) {
      updateWidgetParent(draggedWidgetId, null);
    }
  };

  const renderWidget = (widget, level = 0) => {
    const definition = widgetDefinitions[widget.type];
    const isSelected = widget.id === selectedWidgetId;
    const hasChildren = widget.children && widget.children.length > 0;

    return (
      <div key={widget.id} className="hierarchy-widget-container">
        <div
          className={`hierarchy-widget ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => selectWidget(widget.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, widget.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widget.id)}
        >
          <span className="widget-icon">{definition.icon}</span>
          <span className="widget-name">{widget.name}</span>
          <span className="widget-type-badge">{definition.name}</span>
          {hasChildren && (
            <span className="children-count">({widget.children.length})</span>
          )}
        </div>

        {hasChildren && (
          <div className="hierarchy-children">
            {widget.children.map(child => renderWidget(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="hierarchy-panel">
      <div className="hierarchy-header">
        <h3>Hierarchy</h3>
        <span className="widget-count">{widgets.length} widgets</span>
      </div>

      <div
        className="hierarchy-list"
        onDragOver={handleDragOver}
        onDrop={handleDropOnRoot}
      >
        {tree.length > 0 ? (
          tree.map(widget => renderWidget(widget, 0))
        ) : (
          <div className="no-widgets">
            <p>No widgets yet</p>
            <p className="hint">Add widgets from the palette</p>
          </div>
        )}
      </div>

      {selectedWidgetId && (
        <div className="hierarchy-actions">
          <button
            className="btn-hierarchy-action"
            onClick={() => moveWidgetToFront(selectedWidgetId)}
            title="Move to front"
          >
            ⬆ Front
          </button>
          <button
            className="btn-hierarchy-action"
            onClick={() => moveWidgetToBack(selectedWidgetId)}
            title="Move to back"
          >
            ⬇ Back
          </button>
        </div>
      )}
    </div>
  );
};

export default HierarchyPanel;
