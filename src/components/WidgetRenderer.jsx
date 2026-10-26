import React from 'react';
import { Group, Rect, Text, Circle, Line } from 'react-konva';
import { previewProps } from '../core/previewProps';

const WidgetRenderer = ({ widget, isSelected, onSelect, onDragEnd, onDragStart }) => {
  const { type } = widget;
  const props = previewProps(widget);

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
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#E0E0E0'}
              cornerRadius={props.height / 2}
            />
            <Rect
              width={(props.width * (props.value - props.min)) / (props.max - props.min)}
              height={props.height}
              fill={props.indicatorColor || '#2196F3'}
              cornerRadius={props.height / 2}
            />
            {/* Knob */}
            <Circle
              x={(props.width * (props.value - props.min)) / (props.max - props.min)}
              y={props.height / 2}
              radius={props.height * 0.8}
              fill={props.knobColor || '#1976D2'}
            />
          </>
        );

      case 'switch':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.checked ? props.onColor : props.offColor}
              cornerRadius={props.height / 2}
            />
            <Circle
              x={props.checked ? props.width - props.height / 2 : props.height / 2}
              y={props.height / 2}
              radius={props.height / 2 - 2}
              fill={props.knobColor || '#FFFFFF'}
            />
          </>
        );

      case 'checkbox':
        return (
          <>
            <Rect
              width={20}
              height={20}
              fill={props.checked ? (props.checkedColor || '#2196F3') : '#FFFFFF'}
              stroke="#BDBDBD"
              strokeWidth={2}
              cornerRadius={3}
            />
            {props.checked && (
              <Line
                points={[5, 10, 9, 15, 16, 6]}
                stroke="#FFFFFF"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
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
            {props.password && props.text && (
              <Text
                text={'•'.repeat(props.text.length)}
                x={5}
                y={5}
                width={props.width - 10}
                fill={props.textColor || '#000000'}
                fontSize={props.fontSize || 14}
              />
            )}
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
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#E0E0E0'}
              cornerRadius={3}
            />
            <Rect
              width={(props.width * (props.value - props.min)) / (props.max - props.min)}
              height={props.height}
              fill={props.indicatorColor || '#4CAF50'}
              cornerRadius={3}
            />
          </>
        );

      case 'arc':
        return (
          <>
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2 - 5}
              stroke={props.bgColor || '#E0E0E0'}
              strokeWidth={props.lineWidth || 10}
            />
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2 - 5}
              stroke={props.indicatorColor || '#FF9800'}
              strokeWidth={props.lineWidth || 10}
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
            strokeWidth={props.lineWidth || 4}
            dash={[10, 5]}
          />
        );

      case 'led': {
        const brightness = (props.brightness || 255) / 255;
        return (
          <>
            {/* Glow effect */}
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2 + 3}
              fill={props.color || '#FF0000'}
              opacity={brightness * 0.3}
            />
            {/* LED body */}
            <Circle
              x={props.width / 2}
              y={props.height / 2}
              radius={Math.min(props.width, props.height) / 2}
              fill={props.color || '#FF0000'}
              opacity={brightness}
              stroke="#333333"
              strokeWidth={1}
            />
            {/* Highlight */}
            <Circle
              x={props.width / 2 - 3}
              y={props.height / 2 - 3}
              radius={Math.min(props.width, props.height) / 6}
              fill="rgba(255,255,255,0.5)"
            />
          </>
        );
      }

      case 'dropdown': {
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
      }

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
            <Text
              text={props.src ? '🖼️' : 'No Image'}
              width={props.width}
              height={props.height}
              align="center"
              verticalAlign="middle"
              fill={props.src ? undefined : '#999999'}
              fontSize={props.src ? Math.min(props.width, props.height) / 2 : 12}
              fontFamily="Arial"
            />
          </>
        );

      case 'chart': {
        const dataPoints = props.data ? props.data.split(',').map(Number).filter(n => !isNaN(n)) : [];
        const maxValue = Math.max(...dataPoints, 1);
        const minValue = Math.min(...dataPoints, 0);
        const range = maxValue - minValue || 1;

        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#FFFFFF'}
              stroke="#E0E0E0"
              strokeWidth={1}
              cornerRadius={3}
            />
            {dataPoints.length > 1 && (
              <>
                {props.chartType === 'line' ? (
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
      }

      case 'roller': {
        const rollerOptions = props.options ? props.options.split('\n') : [];
        const visibleRows = Math.min(props.visibleRows || 3, rollerOptions.length);
        const rowHeight = props.height / visibleRows;
        const selectedIndex = props.selected || 0;

        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#F5F5F5'}
              stroke="#BDBDBD"
              strokeWidth={1}
              cornerRadius={5}
            />
            <Rect
              y={rowHeight * Math.floor(visibleRows / 2)}
              width={props.width}
              height={rowHeight}
              fill={props.selectedColor || '#2196F3'}
              opacity={0.2}
              cornerRadius={3}
            />
            {rollerOptions.slice(
              Math.max(0, selectedIndex - Math.floor(visibleRows / 2)),
              Math.max(0, selectedIndex - Math.floor(visibleRows / 2)) + visibleRows
            ).map((option, index) => {
              const actualIndex = Math.max(0, selectedIndex - Math.floor(visibleRows / 2)) + index;
              const isSelectedItem = actualIndex === selectedIndex;
              return (
                <Text
                  key={index}
                  text={option}
                  y={rowHeight * index}
                  width={props.width}
                  height={rowHeight}
                  align="center"
                  verticalAlign="middle"
                  fill={isSelectedItem ? (props.selectedColor || '#2196F3') : (props.textColor || '#000000')}
                  fontSize={props.fontSize || 16}
                  fontStyle={isSelectedItem ? 'bold' : 'normal'}
                  fontFamily="Arial"
                />
              );
            })}
          </>
        );
      }

      case 'imagebutton':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#2196F3'}
              cornerRadius={props.radius || 5}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor="blue"
            />
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

      case 'spinbox':
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
              text={String(props.value || 0).padStart(props.digitCount || 4, '0')}
              width={props.width}
              height={props.height}
              align="center"
              verticalAlign="middle"
              fill={props.textColor || '#000000'}
              fontSize={props.fontSize || 16}
              fontFamily="monospace"
            />
            {/* Up/Down arrows */}
            <Text text="▲" x={props.width - 20} y={2} fontSize={10} fill="#666" />
            <Text text="▼" x={props.width - 20} y={props.height - 14} fontSize={10} fill="#666" />
          </>
        );

      case 'keyboard':
        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill="#E8E8E8"
              cornerRadius={3}
              stroke="#CCCCCC"
              strokeWidth={1}
            />
            {/* Simplified keyboard rows */}
            {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIdx) => {
              const keyWidth = (props.width - 20) / row.length;
              const keyHeight = (props.height - 30) / 4;
              return row.split('').map((key, keyIdx) => (
                <React.Fragment key={`${rowIdx}-${keyIdx}`}>
                  <Rect
                    x={10 + keyIdx * keyWidth + rowIdx * 5}
                    y={10 + rowIdx * (keyHeight + 2)}
                    width={keyWidth - 2}
                    height={keyHeight}
                    fill="#FFFFFF"
                    cornerRadius={3}
                    stroke="#DDDDDD"
                    strokeWidth={0.5}
                  />
                  <Text
                    text={key}
                    x={10 + keyIdx * keyWidth + rowIdx * 5}
                    y={10 + rowIdx * (keyHeight + 2)}
                    width={keyWidth - 2}
                    height={keyHeight}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(10, keyWidth / 2)}
                    fill="#333333"
                  />
                </React.Fragment>
              ));
            })}
            {/* Space bar */}
            <Rect
              x={props.width * 0.25}
              y={props.height - 25}
              width={props.width * 0.5}
              height={18}
              fill="#FFFFFF"
              cornerRadius={3}
              stroke="#DDDDDD"
              strokeWidth={0.5}
            />
          </>
        );

      case 'table': {
        const cols = props.cols || 3;
        const headerRow = props.headerRow ? props.headerRow.split(',') : [];
        const cellData = props.cellData ? props.cellData.split('\n').map(r => r.split(',')) : [];
        const colWidth = props.width / cols;
        const rowHeight = 25;

        return (
          <>
            <Rect
              width={props.width}
              height={props.height}
              fill={props.bgColor || '#FFFFFF'}
              stroke={props.borderColor || '#E0E0E0'}
              strokeWidth={1}
              cornerRadius={2}
            />
            {/* Header */}
            <Rect
              width={props.width}
              height={rowHeight}
              fill={props.headerBgColor || '#F5F5F5'}
              cornerRadius={2}
            />
            {headerRow.map((cell, c) => (
              <React.Fragment key={`h-${c}`}>
                <Text
                  text={cell.trim()}
                  x={c * colWidth + 5}
                  y={0}
                  width={colWidth - 10}
                  height={rowHeight}
                  verticalAlign="middle"
                  fill={props.textColor || '#000000'}
                  fontSize={12}
                  fontStyle="bold"
                  fontFamily="Arial"
                />
                <Line points={[c * colWidth, 0, c * colWidth, props.height]} stroke="#E0E0E0" strokeWidth={0.5} />
              </React.Fragment>
            ))}
            <Line points={[0, rowHeight, props.width, rowHeight]} stroke="#E0E0E0" strokeWidth={1} />
            {/* Data rows */}
            {cellData.map((row, r) => (
              <React.Fragment key={`r-${r}`}>
                {row.map((cell, c) => (
                  <Text
                    key={`c-${r}-${c}`}
                    text={cell.trim()}
                    x={c * colWidth + 5}
                    y={(r + 1) * rowHeight}
                    width={colWidth - 10}
                    height={rowHeight}
                    verticalAlign="middle"
                    fill={props.textColor || '#000000'}
                    fontSize={11}
                    fontFamily="Arial"
                  />
                ))}
                <Line points={[0, (r + 2) * rowHeight, props.width, (r + 2) * rowHeight]} stroke="#E0E0E0" strokeWidth={0.5} />
              </React.Fragment>
            ))}
          </>
        );
      }

      case 'scale': {
        const scaleMin = props.min || 0;
        const scaleMax = props.max || 100;
        const majorEvery = props.majorTickEvery || 10;
        const isHorizontal = props.mode === 'horizontal' || !props.mode;

        return (
          <>
            <Rect width={props.width} height={props.height} fill="transparent" />
            {/* Ticks */}
            {Array.from({ length: Math.floor((scaleMax - scaleMin) / majorEvery) + 1 }, (_, i) => {
              const val = scaleMin + i * majorEvery;
              if (isHorizontal) {
                const x = (i / ((scaleMax - scaleMin) / majorEvery)) * (props.width - 20) + 10;
                return (
                  <React.Fragment key={i}>
                    <Line points={[x, 0, x, props.majorTickLength || 15]} stroke={props.lineColor || '#000'} strokeWidth={1.5} />
                    {props.labelShow !== false && (
                      <Text text={String(val)} x={x - 10} y={(props.majorTickLength || 15) + 2} fontSize={10} fill={props.textColor || '#000'} width={20} align="center" />
                    )}
                  </React.Fragment>
                );
              } else {
                const y = (i / ((scaleMax - scaleMin) / majorEvery)) * (props.height - 20) + 10;
                return (
                  <React.Fragment key={i}>
                    <Line points={[0, y, props.majorTickLength || 15, y]} stroke={props.lineColor || '#000'} strokeWidth={1.5} />
                    {props.labelShow !== false && (
                      <Text text={String(val)} x={(props.majorTickLength || 15) + 5} y={y - 6} fontSize={10} fill={props.textColor || '#000'} />
                    )}
                  </React.Fragment>
                );
              }
            })}
          </>
        );
      }

      case 'tabview': {
        const tabList = props.tabs ? props.tabs.split('\n') : ['Tab 1', 'Tab 2'];
        const tabBarH = props.tabBarSize || 40;
        const tabW = props.width / tabList.length;

        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={3} stroke="#E0E0E0" strokeWidth={1} />
            {/* Tab bar */}
            <Rect width={props.width} height={tabBarH} fill={props.tabBgColor || '#F5F5F5'} cornerRadius={3} />
            {tabList.map((tab, i) => (
              <React.Fragment key={i}>
                <Text
                  text={tab.trim()}
                  x={i * tabW}
                  y={0}
                  width={tabW}
                  height={tabBarH}
                  align="center"
                  verticalAlign="middle"
                  fill={i === (props.activeTab || 0) ? (props.tabActiveColor || '#2196F3') : (props.textColor || '#000')}
                  fontSize={12}
                  fontStyle={i === (props.activeTab || 0) ? 'bold' : 'normal'}
                  fontFamily="Arial"
                />
                {i === (props.activeTab || 0) && (
                  <Rect x={i * tabW} y={tabBarH - 3} width={tabW} height={3} fill={props.tabActiveColor || '#2196F3'} />
                )}
              </React.Fragment>
            ))}
          </>
        );
      }

      case 'tileview': {
        const tileRows = props.rows || 2;
        const tileCols = props.cols || 2;
        const tileW = props.width / tileCols;
        const tileH = props.height / tileRows;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} stroke="#CCCCCC" strokeWidth={1} cornerRadius={3} />
            {Array.from({ length: tileRows * tileCols }, (_, idx) => {
              const r = Math.floor(idx / tileCols);
              const c = idx % tileCols;
              return (
                <React.Fragment key={idx}>
                  <Rect x={c * tileW} y={r * tileH} width={tileW} height={tileH} stroke="#E0E0E0" strokeWidth={0.5} />
                  <Text text={`Tile ${idx + 1}`} x={c * tileW} y={r * tileH} width={tileW} height={tileH} align="center" verticalAlign="middle" fill="#999999" fontSize={10} />
                </React.Fragment>
              );
            })}
          </>
        );
      }

      case 'menu': {
        const menuItems = props.items ? props.items.split('\n') : ['Item 1', 'Item 2'];
        const itemH = 35;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={3} stroke="#E0E0E0" strokeWidth={1} />
            {/* Header */}
            <Rect width={props.width} height={35} fill={props.selectedColor || '#2196F3'} cornerRadius={3} />
            <Text text={props.headerTitle || 'Menu'} width={props.width} height={35} align="center" verticalAlign="middle" fill="#FFFFFF" fontSize={14} fontStyle="bold" />
            {/* Items */}
            {menuItems.map((item, i) => (
              <React.Fragment key={i}>
                <Text
                  text={item.trim()}
                  x={15}
                  y={40 + i * itemH}
                  width={props.width - 30}
                  height={itemH}
                  verticalAlign="middle"
                  fill={props.textColor || '#000000'}
                  fontSize={13}
                  fontFamily="Arial"
                />
                <Line points={[10, 40 + (i + 1) * itemH, props.width - 10, 40 + (i + 1) * itemH]} stroke="#F0F0F0" strokeWidth={1} />
              </React.Fragment>
            ))}
          </>
        );
      }

      case 'win':
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={5} stroke="#E0E0E0" strokeWidth={1} />
            {/* Title bar */}
            <Rect width={props.width} height={props.headerHeight || 40} fill={props.headerBgColor || '#2196F3'} cornerRadius={5} />
            <Rect x={0} y={20} width={props.width} height={(props.headerHeight || 40) - 20} fill={props.headerBgColor || '#2196F3'} />
            <Text
              text={props.title || 'Window'}
              x={10}
              y={0}
              width={props.width - 40}
              height={props.headerHeight || 40}
              verticalAlign="middle"
              fill={props.titleColor || '#FFFFFF'}
              fontSize={14}
              fontStyle="bold"
              fontFamily="Arial"
            />
            {/* Close button */}
            <Text text="✕" x={props.width - 30} y={0} width={20} height={props.headerHeight || 40} verticalAlign="middle" align="center" fill="#FFFFFF" fontSize={14} />
          </>
        );

      case 'list': {
        const listItems = props.items ? props.items.split('\n') : [];
        const listItemH = 35;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={3} stroke="#E0E0E0" strokeWidth={1} />
            {listItems.map((item, i) => (
              <React.Fragment key={i}>
                <Text
                  text={item.trim()}
                  x={15}
                  y={i * listItemH}
                  width={props.width - 30}
                  height={listItemH}
                  verticalAlign="middle"
                  fill={props.textColor || '#000000'}
                  fontSize={props.fontSize || 14}
                  fontFamily="Arial"
                />
                <Line points={[0, (i + 1) * listItemH, props.width, (i + 1) * listItemH]} stroke="#F0F0F0" strokeWidth={0.5} />
              </React.Fragment>
            ))}
          </>
        );
      }

      case 'msgbox':
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={8} stroke="#E0E0E0" strokeWidth={1} shadowBlur={10} shadowColor="rgba(0,0,0,0.2)" shadowOffsetY={2} />
            {/* Title */}
            <Text
              text={props.title || 'Notice'}
              x={15}
              y={10}
              width={props.width - 50}
              height={25}
              fill={props.titleColor || '#333333'}
              fontSize={16}
              fontStyle="bold"
              fontFamily="Arial"
            />
            {props.closeButton && (
              <Text text="✕" x={props.width - 30} y={10} width={20} height={20} align="center" fill="#666" fontSize={14} />
            )}
            {/* Message */}
            <Text
              text={props.text || ''}
              x={15}
              y={40}
              width={props.width - 30}
              height={props.height - 90}
              fill={props.textColor || '#000000'}
              fontSize={props.fontSize || 14}
              fontFamily="Arial"
            />
            {/* Buttons */}
            {props.buttons && props.buttons.split('\n').map((btn, i) => {
              const btnW = 80;
              const btnX = props.width - 15 - (props.buttons.split('\n').length - i) * (btnW + 10);
              return (
                <React.Fragment key={i}>
                  <Rect x={btnX} y={props.height - 45} width={btnW} height={30} fill="#2196F3" cornerRadius={4} />
                  <Text text={btn.trim()} x={btnX} y={props.height - 45} width={btnW} height={30} align="center" verticalAlign="middle" fill="#FFFFFF" fontSize={12} />
                </React.Fragment>
              );
            })}
          </>
        );

      case 'buttonmatrix': {
        const mapRows = props.map ? props.map.split('\n') : ['1,2,3'];
        const rowH = props.height / mapRows.length;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={3} stroke="#E0E0E0" strokeWidth={1} />
            {mapRows.map((row, r) => {
              const btns = row.split(',');
              const btnW = props.width / btns.length;
              return btns.map((btn, c) => (
                <React.Fragment key={`${r}-${c}`}>
                  <Rect
                    x={c * btnW + 1}
                    y={r * rowH + 1}
                    width={btnW - 2}
                    height={rowH - 2}
                    fill={props.btnColor || '#E0E0E0'}
                    cornerRadius={3}
                  />
                  <Text
                    text={btn.trim()}
                    x={c * btnW}
                    y={r * rowH}
                    width={btnW}
                    height={rowH}
                    align="center"
                    verticalAlign="middle"
                    fill={props.textColor || '#000000'}
                    fontSize={props.fontSize || 14}
                    fontFamily="Arial"
                  />
                </React.Fragment>
              ));
            })}
          </>
        );
      }

      case 'calendar': {
        const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        const cellW = props.width / 7;
        const cellH = (props.height - 35) / 7;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={5} stroke="#E0E0E0" strokeWidth={1} />
            {/* Header */}
            {props.showHeader && (
              <>
                <Text text="◀" x={5} y={3} width={30} height={25} align="center" verticalAlign="middle" fill="#666" fontSize={14} />
                <Text
                  text={`${props.month || 1}/${props.year || 2026}`}
                  width={props.width}
                  height={30}
                  align="center"
                  verticalAlign="middle"
                  fill="#333"
                  fontSize={13}
                  fontStyle="bold"
                />
                <Text text="▶" x={props.width - 35} y={3} width={30} height={25} align="center" verticalAlign="middle" fill="#666" fontSize={14} />
              </>
            )}
            {/* Day names */}
            {days.map((d, i) => (
              <Text key={d} text={d} x={i * cellW} y={30} width={cellW} height={cellH} align="center" verticalAlign="middle" fill="#666" fontSize={10} fontStyle="bold" />
            ))}
            {/* Days grid */}
            {Array.from({ length: 28 }, (_, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;
              const day = i + 1;
              const isToday = day === (props.day || 1);
              return (
                <React.Fragment key={i}>
                  {isToday && (
                    <Circle
                      x={col * cellW + cellW / 2}
                      y={30 + cellH + row * cellH + cellH / 2}
                      radius={cellH / 2.5}
                      fill={props.todayColor || '#2196F3'}
                    />
                  )}
                  <Text
                    text={String(day)}
                    x={col * cellW}
                    y={30 + cellH + row * cellH}
                    width={cellW}
                    height={cellH}
                    align="center"
                    verticalAlign="middle"
                    fill={isToday ? '#FFFFFF' : '#333'}
                    fontSize={10}
                  />
                </React.Fragment>
              );
            })}
          </>
        );
      }

      case 'line': {
        const pointPairs = props.points ? props.points.split(' ').map(p => p.split(',').map(Number)) : [[0, 0], [props.width || 200, 0]];
        const flatPoints = pointPairs.flat();
        return (
          <Line
            points={flatPoints}
            stroke={props.lineColor || '#000000'}
            strokeWidth={props.lineWidth || 2}
            lineCap={props.rounded ? 'round' : 'butt'}
            lineJoin={props.rounded ? 'round' : 'miter'}
          />
        );
      }

      case 'span': {
        const spanLines = props.spans ? props.spans.split('\n') : [];
        let yOff = 5;
        return (
          <>
            <Rect width={props.width} height={props.height} fill={props.bgColor || '#FFFFFF'} cornerRadius={3} stroke="#E0E0E0" strokeWidth={0.5} />
            {spanLines.map((spanDef, i) => {
              const parts = spanDef.split('|');
              const text = parts[0] || '';
              const size = parseInt(parts[1]) || 14;
              const color = parts[2] || '#000000';
              const elem = (
                <Text
                  key={i}
                  text={text.trim()}
                  x={5}
                  y={yOff}
                  width={props.width - 10}
                  fill={color}
                  fontSize={size}
                  fontFamily="Arial"
                />
              );
              yOff += size + 4;
              return elem;
            })}
          </>
        );
      }

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
      opacity={props.opacity !== undefined ? props.opacity / 255 : 1}
      visible={!props.hidden}
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
