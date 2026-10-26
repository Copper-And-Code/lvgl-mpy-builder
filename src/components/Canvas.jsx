import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useShallow } from 'zustand/react/shallow';
import useStore, { selectCanvasSize, selectWidgets } from '../core/store';
import { childrenByParent as groupByParent, findWidget } from '../core/projectModel';
import WidgetRenderer from './WidgetRenderer';

const BACKGROUND = 'canvas-background';

const Canvas = () => {
  const stageRef = useRef();
  const containerRef = useRef();
  const widgets = useStore(selectWidgets);
  const canvasSize = useStore(selectCanvasSize);
  const { selectedWidgetId, zoom, gridEnabled, snapToGrid, gridSize } = useStore(
    useShallow((state) => ({
      selectedWidgetId: state.selectedWidgetId,
      zoom: state.zoom,
      gridEnabled: state.gridEnabled,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }))
  );
  const { selectWidget, deselectWidget, moveWidget, setZoom } = useStore(
    useShallow((state) => ({
      selectWidget: state.selectWidget,
      deselectWidget: state.deselectWidget,
      moveWidget: state.moveWidget,
      setZoom: state.setZoom,
    }))
  );
  const childrenByParent = useMemo(() => groupByParent(widgets), [widgets]);

  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Measure container size and auto-fit zoom on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width - 40, // padding
          height: rect.height - 80, // padding + info bar
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFitToScreen = useCallback(() => {
    const scaleX = containerSize.width / canvasSize.width;
    const scaleY = containerSize.height / canvasSize.height;
    const fitZoom = Math.min(scaleX, scaleY, 1); // never zoom above 100%
    setZoom(fitZoom);
  }, [containerSize, canvasSize, setZoom]);

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || e.target.name() === BACKGROUND) {
      deselectWidget();
    }
  };

  // Positions are relative to the parent (the screen for top-level widgets)
  const handleWidgetDragEnd = (id, e) => {
    const widget = findWidget(widgets, id);
    let x = e.target.x();
    let y = e.target.y();

    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    // Top-level widgets stay on the display; children may overflow (LVGL scrolls them)
    if (widget && !widget.parentId) {
      x = Math.max(0, Math.min(x, canvasSize.width - (widget.props.width ?? 0)));
      y = Math.max(0, Math.min(y, canvasSize.height - (widget.props.height ?? 0)));
    }

    // Keep the node where the store puts it, even when the value does not change
    e.target.position({ x, y });
    moveWidget(id, x, y);
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? -0.05 : 0.05;
    setZoom(zoom + delta);
  };

  const renderGrid = () => {
    if (!gridEnabled) return null;

    const lines = [];
    const cols = Math.ceil(canvasSize.width / gridSize);
    const rows = Math.ceil(canvasSize.height / gridSize);

    for (let i = 0; i <= cols; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, canvasSize.height]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    for (let i = 0; i <= rows; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, canvasSize.width, i * gridSize]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return lines;
  };

  // Stage dimensions account for zoom so the visible area shrinks/grows
  const stageWidth = Math.max(canvasSize.width * zoom, 100);
  const stageHeight = Math.max(canvasSize.height * zoom, 100);

  return (
    <div className="canvas-container" ref={containerRef}>
      <div className="canvas-scroll-area">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={zoom}
          scaleY={zoom}
          onClick={handleStageClick}
          onWheel={handleWheel}
          style={{
            border: '2px solid #ccc',
            background: '#ffffff',
            cursor: isDragging ? 'grabbing' : 'default',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fill="#ffffff"
              name={BACKGROUND}
            />

            {/* Grid */}
            {renderGrid()}

            {/* Widgets */}
            {(childrenByParent.get(null) ?? []).map((widget) => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                childrenByParent={childrenByParent}
                selectedWidgetId={selectedWidgetId}
                onSelect={selectWidget}
                onDragEnd={handleWidgetDragEnd}
                onDragStart={() => setIsDragging(true)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Canvas info bar */}
      <div className="canvas-info">
        <span>Canvas: {canvasSize.width} x {canvasSize.height}px</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Widgets: {widgets.length}</span>
        <button className="canvas-fit-btn" onClick={handleFitToScreen} title="Fit canvas to window">
          Fit
        </button>
      </div>
    </div>
  );
};

export default Canvas;
