import React, { useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import useStore from '../core/store';
import WidgetRenderer from './WidgetRenderer';

const Canvas = () => {
  const stageRef = useRef();
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
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);

  const handleStageClick = (e) => {
    // Deselect widget when clicking on stage background
    if (e.target === e.target.getStage()) {
      deselectWidget();
    }
  };

  const handleWidgetDragEnd = (id, e) => {
    let x = e.target.x();
    let y = e.target.y();

    // Snap to grid if enabled
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    // Keep widget within canvas bounds
    x = Math.max(0, Math.min(x, canvasSize.width));
    y = Math.max(0, Math.min(y, canvasSize.height));

    updateWidget(id, { x, y });
    setIsDragging(false);
  };

  const renderGrid = () => {
    if (!gridEnabled) return null;

    const lines = [];
    const cols = Math.ceil(canvasSize.width / gridSize);
    const rows = Math.ceil(canvasSize.height / gridSize);

    // Vertical lines
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

    // Horizontal lines
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

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        style={{
          border: '2px solid #ccc',
          background: '#ffffff',
          cursor: isDragging ? 'grabbing' : 'default',
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

      {/* Canvas info */}
      <div className="canvas-info">
        <span>Canvas: {canvasSize.width}x{canvasSize.height}px</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Widgets: {widgets.length}</span>
      </div>
    </div>
  );
};

export default Canvas;
