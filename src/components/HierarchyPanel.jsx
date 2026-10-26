import { useShallow } from 'zustand/react/shallow';
import useStore, { selectWidgets } from '../core/store';
import { childrenByParent } from '../core/projectModel';
import { widgetDefinitions } from '../core/widgetDefinitions';
import '../styles/HierarchyPanel.css';

const HierarchyPanel = () => {
  const widgets = useStore(selectWidgets);
  const { selectedWidgetId, selectWidget, setWidgetParent, moveWidgetToFront, moveWidgetToBack } = useStore(
    useShallow((state) => ({
      selectedWidgetId: state.selectedWidgetId,
      selectWidget: state.selectWidget,
      setWidgetParent: state.setWidgetParent,
      moveWidgetToFront: state.moveWidgetToFront,
      moveWidgetToBack: state.moveWidgetToBack,
    }))
  );

  // Build hierarchy tree (widgets whose parent is missing are shown at the top level)
  const buildTree = () => {
    const children = childrenByParent(widgets);
    const toNode = (widget) => ({ ...widget, children: (children.get(widget.id) ?? []).map(toNode) });
    return (children.get(null) ?? []).map(toNode);
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
        setWidgetParent(draggedWidgetId, targetWidgetId);
      }
    }
  };

  const handleDropOnRoot = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedWidgetId = e.dataTransfer.getData('widgetId');
    if (draggedWidgetId) {
      setWidgetParent(draggedWidgetId, null);
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
