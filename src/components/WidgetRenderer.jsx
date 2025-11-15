import React from 'react';
import { Group, Rect, Text, Circle, Line } from 'react-konva';

const WidgetRenderer = ({ widget, isSelected, onSelect, onDragEnd, onDragStart }) => {
  const { id, type, props } = widget;

  const renderWidget = () => {
    switch (type) {
      case 'button':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor}
              cornerRadius={props.radius || 0}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor="blue"
            />
            <Text
              text={props.text || 'Button'}
              width={props.width}
              height={props.height}
              align="center"
              verticalAlign="middle"
              fill={props.textColor}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
            />
          </>
        );

      case 'label':
        return (
          <Text
            text={props.text || 'Label'}
            fill={props.textColor || '#000000'}
            fontSize={props.fontSize || 14}
            fontFamily="Arial"
            width={props.width}
            height={props.height}
          />
        );

      case 'slider':
        return (
          <>
            {/* Background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#E0E0E0'}
              cornerRadius={props.height / 2}
            />
            {/* Indicator */}
            <Rect
              width={(props.width * (props.value - props.min)) / (props.max - props.min)}
              height={props.height}
              fill={props.indicatorColor || '#2196F3'}
              cornerRadius={props.height / 2}
            />
          </>
        );

      case 'switch':
        return (
          <>
            {/* Background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.checked ? props.onColor : props.offColor}
              cornerRadius={props.height / 2}
            />
            {/* Knob */}
            <Circle
              x={props.checked ? props.width - props.height / 2 : props.height / 2}
              y={props.height / 2}
              radius={props.height / 2 - 2}
              fill="#FFFFFF"
            />
          </>
        );

      case 'checkbox':
        return (
          <>
            <Rect
              width={20}
              height={20}
              fill="#FFFFFF"
              stroke="#BDBDBD"
              strokeWidth={2}
              cornerRadius={3}
            />
            {props.checked && (
              <>
                <Line
                  points={[5, 10, 9, 15, 16, 6]}
                  stroke="#2196F3"
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}
            <Text
              text={props.text || 'Checkbox'}
              x={25}
              y={0}
              fill={props.textColor || '#000000'}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
              height={20}
              verticalAlign="middle"
            />
          </>
        );

      case 'textarea':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#FFFFFF'}
              stroke="#BDBDBD"
              strokeWidth={1}
              cornerRadius={3}
            />
            <Text
              text={props.text || props.placeholder || 'Enter text...'}
              x={5}
              y={5}
              width={props.width - 10}
              height={props.height - 10}
              fill={props.text ? props.textColor : '#BDBDBD'}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
            />
          </>
        );

      case 'panel':
        return (
          <Rect
            width={props.width}
            height={props.height}
            fill={props.bgColor || '#F5F5F5'}
            stroke={props.borderColor || '#BDBDBD'}
            strokeWidth={props.borderWidth || 0}
            cornerRadius={props.radius || 0}
          />
        );

      case 'bar':
        return (
          <>
            {/* Background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#E0E0E0'}
              cornerRadius={3}
            />
            {/* Indicator */}
            <Rect
              width={(props.width * (props.value - props.min)) / (props.max - props.min)}
              height={props.height}
              fill={props.indicatorColor || '#4CAF50'}
              cornerRadius={3}
            />
          </>
        );

      case 'arc':
        // Simplified arc representation
        return (
          <>
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2 - 5}
              stroke={props.bgColor || '#E0E0E0'}
              strokeWidth={10}
            />
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2 - 5}
              stroke={props.indicatorColor || '#FF9800'}
              strokeWidth={10}
              dash={[20, 10]}
              dashOffset={-((1 - (props.value - props.min) / (props.max - props.min)) * 100)}
            />
          </>
        );

      case 'spinner':
        return (
          <Circle
            x={props.width / 2}
            y={props.height / 2}
            radius={Math.min(props.width, props.height) / 2}
            stroke={props.color || '#2196F3'}
            strokeWidth={4}
            dash={[10, 5]}
          />
        );

      case 'dropdown':
        const options = props.options ? props.options.split('\n') : [];
        const selectedOption = options[props.selected] || 'Select...';
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#FFFFFF'}
              stroke="#BDBDBD"
              strokeWidth={1}
              cornerRadius={3}
            />
            <Text
              text={selectedOption}
              x={10}
              y={0}
              width={props.width - 30}
              height={props.height}
              verticalAlign="middle"
              fill={props.textColor || '#000000'}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
            />
            {/* Dropdown arrow */}
            <Text
              text="▼"
              x={props.width - 25}
              y={0}
              width={20}
              height={props.height}
              verticalAlign="middle"
              align="center"
              fill="#666666"
              fontSize={10}
            />
          </>
        );

      case 'image':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#F0F0F0'}
              stroke="#BDBDBD"
              strokeWidth={1}
              cornerRadius={3}
            />
            {props.src ? (
              <Text
                text="🖼️"
                width={props.width}
                height={props.height}
                align="center"
                verticalAlign="middle"
                fontSize={Math.min(props.width, props.height) / 2}
              />
            ) : (
              <Text
                text="No Image"
                width={props.width}
                height={props.height}
                align="center"
                verticalAlign="middle"
                fill="#999999"
                fontSize={12}
                fontFamily="Arial"
              />
            )}
          </>
        );

      case 'chart':
        const dataPoints = props.data ? props.data.split(',').map(Number).filter(n => !isNaN(n)) : [];
        const maxValue = Math.max(...dataPoints, 1);
        const minValue = Math.min(...dataPoints, 0);
        const range = maxValue - minValue || 1;

        return (
          <>
            {/* Chart background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#FFFFFF'}
              stroke="#E0E0E0"
              strokeWidth={1}
              cornerRadius={3}
            />

            {/* Chart data */}
            {dataPoints.length > 1 && (
              <>
                {props.chartType === 'line' ? (
                  // Line chart
                  <>
                    {dataPoints.map((value, index) => {
                      if (index === 0) return null;
                      const x1 = ((index - 1) / (dataPoints.length - 1)) * (props.width - 20) + 10;
                      const x2 = (index / (dataPoints.length - 1)) * (props.width - 20) + 10;
                      const y1 = props.height - 10 - ((dataPoints[index - 1] - minValue) / range) * (props.height - 20);
                      const y2 = props.height - 10 - ((value - minValue) / range) * (props.height - 20);

                      return (
                        <Line
                          key={index}
                          points={[x1, y1, x2, y2]}
                          stroke={props.lineColor || '#2196F3'}
                          strokeWidth={2}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    })}

                    {/* Points */}
                    {props.showPoints && dataPoints.map((value, index) => {
                      const x = (index / (dataPoints.length - 1)) * (props.width - 20) + 10;
                      const y = props.height - 10 - ((value - minValue) / range) * (props.height - 20);

                      return (
                        <Circle
                          key={`point-${index}`}
                          x={x}
                          y={y}
                          radius={3}
                          fill={props.lineColor || '#2196F3'}
                        />
                      );
                    })}
                  </>
                ) : (
                  // Bar chart
                  dataPoints.map((value, index) => {
                    const barWidth = (props.width - 20) / dataPoints.length - 5;
                    const x = 10 + index * ((props.width - 20) / dataPoints.length);
                    const barHeight = ((value - minValue) / range) * (props.height - 20);
                    const y = props.height - 10 - barHeight;

                    return (
                      <Rect
                        key={index}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={props.lineColor || '#2196F3'}
                        cornerRadius={2}
                      />
                    );
                  })
                )}
              </>
            )}
          </>
        );

      case 'roller':
        const rollerOptions = props.options ? props.options.split('\n') : [];
        const visibleRows = Math.min(props.visibleRows || 3, rollerOptions.length);
        const rowHeight = props.height / visibleRows;
        const selectedIndex = props.selected || 0;

        return (
          <>
            {/* Background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#F5F5F5'}
              stroke="#BDBDBD"
              strokeWidth={1}
              cornerRadius={5}
            />

            {/* Selected item highlight */}
            <Rect
              y={rowHeight * Math.floor(visibleRows / 2)}
              width={props.width}
              height={rowHeight}
              fill={props.selectedColor || '#2196F3'}
              opacity={0.2}
              cornerRadius={3}
            />

            {/* Options */}
            {rollerOptions.slice(
              Math.max(0, selectedIndex - Math.floor(visibleRows / 2)),
              Math.max(0, selectedIndex - Math.floor(visibleRows / 2)) + visibleRows
            ).map((option, index) => {
              const actualIndex = Math.max(0, selectedIndex - Math.floor(visibleRows / 2)) + index;
              const isSelected = actualIndex === selectedIndex;

              return (
                <Text
                  key={index}
                  text={option}
                  y={rowHeight * index}
                  width={props.width}
                  height={rowHeight}
                  align="center"
                  verticalAlign="middle"
                  fill={isSelected ? (props.selectedColor || '#2196F3') : (props.textColor || '#000000')}
                  fontSize={props.fontSize || 16}
                  fontStyle={isSelected ? 'bold' : 'normal'}
                  fontFamily="Arial"
                />
              );
            })}
          </>
        );

      case 'imagebutton':
        return (
          <>
            {/* Button background */}
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#2196F3'}
              cornerRadius={props.radius || 5}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor="blue"
            />

            {/* Image area */}
            {props.src ? (
              <Text
                text="🖼️"
                width={props.width}
                height={props.height - 30}
                align="center"
                verticalAlign="middle"
                fontSize={Math.min(props.width, props.height - 30) / 2}
              />
            ) : (
              <Rect
                x={10}
                y={10}
                width={props.width - 20}
                height={props.height - 50}
                fill="rgba(255, 255, 255, 0.3)"
                cornerRadius={3}
              />
            )}

            {/* Button text */}
            <Text
              text={props.text || 'Button'}
              y={props.height - 35}
              width={props.width}
              height={30}
              align="center"
              verticalAlign="middle"
              fill={props.textColor || '#FFFFFF'}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
            />
          </>
        );

      default:
        return (
          <Rect
            width={props.width || 100}
            height={props.height || 100}
            fill="#CCCCCC"
            stroke="#666666"
            strokeWidth={1}
          />
        );
    }
  };

  return (
    <Group
      x={props.x}
      y={props.y}
      draggable
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onClick={onSelect}
      onTap={onSelect}
    >
      {renderWidget()}

      {/* Selection border */}
      {isSelected && (
        <Rect
          width={props.width}
          height={props.height}
          stroke="blue"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}
    </Group>
  );
};

export default WidgetRenderer;
