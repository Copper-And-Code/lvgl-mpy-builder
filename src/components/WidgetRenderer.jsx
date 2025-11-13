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
