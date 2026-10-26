import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import useStore from '../core/store';
import WidgetRenderer from './WidgetRenderer';

const Canvas = () => {
  const stageRef = useRef();
  const containerRef = useRef();
  const {
    widgets,
    selectedWidgetId,
    canvasSize,
    zoom,
    gridEnabled,
    snapToGrid,
    gridSize,
    selectWidget,
    deselectWidget,
    updateWidget,
    setZoom,
  } = useStore();

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
    if (e.target === e.target.getStage()) {
      deselectWidget();
    }
  };

  const handleWidgetDragEnd = (id, e) => {
    let x = e.target.x();
    let y = e.target.y();

    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    x = Math.max(0, Math.min(x, canvasSize.width));
    y = Math.max(0, Math.min(y, canvasSize.height));

    updateWidget(id, { x, y });
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
              listening={true}
            />

            {/* Grid */}
            {renderGrid()}

            {/* Widgets */}
            {widgets.map((widget) => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                isSelected={selectedWidgetId === widget.id}
                onSelect={() => selectWidget(widget.id)}
                onDragEnd={(e) => handleWidgetDragEnd(widget.id, e)}
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
