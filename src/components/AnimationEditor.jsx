import React, { useState } from 'react';
import '../styles/AnimationEditor.css';

// LVGL Animation Properties
export const ANIMATION_TYPES = {
  MOVE_X: 'move_x',
  MOVE_Y: 'move_y',
  MOVE_XY: 'move_xy',
  SCALE: 'scale',
  ROTATE: 'rotate',
  FADE_IN: 'fade_in',
  FADE_OUT: 'fade_out',
  WIDTH: 'width',
  HEIGHT: 'height',
  SIZE: 'size',
};

export const ANIMATION_PATHS = {
  LINEAR: 'lv_anim_path_linear',
  EASE_IN: 'lv_anim_path_ease_in',
  EASE_OUT: 'lv_anim_path_ease_out',
  EASE_IN_OUT: 'lv_anim_path_ease_in_out',
  OVERSHOOT: 'lv_anim_path_overshoot',
  BOUNCE: 'lv_anim_path_bounce',
};

const AnimationEditor = ({ widget, onUpdateAnimations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animations = widget.animations || [];

  const handleAddAnimation = () => {
    const newAnimation = {
      id: `anim_${Date.now()}`,
      type: ANIMATION_TYPES.MOVE_X,
      duration: 1000,
      delay: 0,
      repeat: 0,
      playback: false,
      startValue: 0,
      endValue: 100,
      path: ANIMATION_PATHS.LINEAR,
    };

    const updatedAnimations = [...animations, newAnimation];
    onUpdateAnimations(updatedAnimations);
  };

  const handleUpdateAnimation = (animId, field, value) => {
    const updatedAnimations = animations.map((anim) =>
      anim.id === animId ? { ...anim, [field]: value } : anim
    );
    onUpdateAnimations(updatedAnimations);
  };

  const handleDeleteAnimation = (animId) => {
    const updatedAnimations = animations.filter((anim) => anim.id !== animId);
    onUpdateAnimations(updatedAnimations);
  };

  return (
    <div className="animation-editor">
      <div className="animation-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Animations ({animations.length})</h4>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="animation-content">
          <button className="btn-add-animation" onClick={handleAddAnimation}>
            + Add Animation
          </button>

          <div className="animations-list">
            {animations.length > 0 ? (
              animations.map((animation) => (
                <div key={animation.id} className="animation-item">
                  <div className="animation-item-header">
                    <select
                      value={animation.type}
                      onChange={(e) => handleUpdateAnimation(animation.id, 'type', e.target.value)}
                      className="animation-type-select"
                    >
                      {Object.entries(ANIMATION_TYPES).map(([key, value]) => (
                        <option key={value} value={value}>
                          {key.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-delete-animation"
                      onClick={() => handleDeleteAnimation(animation.id)}
                      title="Delete animation"
                    >
                      ×
                    </button>
                  </div>

                  <div className="animation-details">
                    <div className="animation-row">
                      <div className="property-field">
                        <label>Duration (ms)</label>
                        <input
                          type="number"
                          value={animation.duration}
                          onChange={(e) => handleUpdateAnimation(animation.id, 'duration', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>

                      <div className="property-field">
                        <label>Delay (ms)</label>
                        <input
                          type="number"
                          value={animation.delay}
                          onChange={(e) => handleUpdateAnimation(animation.id, 'delay', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="animation-row">
                      <div className="property-field">
                        <label>Start Value</label>
                        <input
                          type="number"
                          value={animation.startValue}
                          onChange={(e) => handleUpdateAnimation(animation.id, 'startValue', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="property-field">
                        <label>End Value</label>
                        <input
                          type="number"
                          value={animation.endValue}
                          onChange={(e) => handleUpdateAnimation(animation.id, 'endValue', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="property-field">
                      <label>Animation Path</label>
                      <select
                        value={animation.path}
                        onChange={(e) => handleUpdateAnimation(animation.id, 'path', e.target.value)}
                      >
                        {Object.entries(ANIMATION_PATHS).map(([key, value]) => (
                          <option key={value} value={value}>
                            {key.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="animation-row">
                      <div className="property-field">
                        <label>Repeat Count</label>
                        <input
                          type="number"
                          value={animation.repeat}
                          onChange={(e) => handleUpdateAnimation(animation.id, 'repeat', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>

                      <div className="property-field checkbox-field">
                        <label>
                          <input
                            type="checkbox"
                            checked={animation.playback || false}
                            onChange={(e) => handleUpdateAnimation(animation.id, 'playback', e.target.checked)}
                          />
                          Playback
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-animations">No animations configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationEditor;
