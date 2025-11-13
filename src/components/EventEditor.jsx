import React, { useState } from 'react';
import '../styles/EventEditor.css';

// LVGL Event Types
export const LVGL_EVENT_TYPES = {
  CLICKED: 'LV_EVENT_CLICKED',
  PRESSED: 'LV_EVENT_PRESSED',
  RELEASED: 'LV_EVENT_RELEASED',
  VALUE_CHANGED: 'LV_EVENT_VALUE_CHANGED',
  FOCUSED: 'LV_EVENT_FOCUSED',
  DEFOCUSED: 'LV_EVENT_DEFOCUSED',
  READY: 'LV_EVENT_READY',
  CANCEL: 'LV_EVENT_CANCEL',
};

const EventEditor = ({ widget, onUpdateEvents }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleAddEvent = () => {
    const newEvent = {
      id: `evt_${Date.now()}`,
      type: LVGL_EVENT_TYPES.CLICKED,
      callback: `${widget.name}_event_handler`,
      code: '// Custom event code here',
    };

    const updatedEvents = [...(widget.events || []), newEvent];
    onUpdateEvents(updatedEvents);
    setEditingEvent(newEvent.id);
  };

  const handleUpdateEvent = (eventId, field, value) => {
    const updatedEvents = widget.events.map((evt) =>
      evt.id === eventId ? { ...evt, [field]: value } : evt
    );
    onUpdateEvents(updatedEvents);
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = widget.events.filter((evt) => evt.id !== eventId);
    onUpdateEvents(updatedEvents);
    if (editingEvent === eventId) {
      setEditingEvent(null);
    }
  };

  return (
    <div className="event-editor">
      <div className="event-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Events ({widget.events?.length || 0})</h4>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="event-content">
          <button className="btn-add-event" onClick={handleAddEvent}>
            + Add Event
          </button>

          <div className="events-list">
            {widget.events && widget.events.length > 0 ? (
              widget.events.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-item-header">
                    <select
                      value={event.type}
                      onChange={(e) => handleUpdateEvent(event.id, 'type', e.target.value)}
                      className="event-type-select"
                    >
                      {Object.entries(LVGL_EVENT_TYPES).map(([key, value]) => (
                        <option key={value} value={value}>
                          {key}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-delete-event"
                      onClick={() => handleDeleteEvent(event.id)}
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>

                  <div className="event-details">
                    <div className="property-field">
                      <label>Callback Function</label>
                      <input
                        type="text"
                        value={event.callback}
                        onChange={(e) => handleUpdateEvent(event.id, 'callback', e.target.value)}
                        placeholder="event_handler_name"
                      />
                    </div>

                    {editingEvent === event.id && (
                      <div className="property-field">
                        <label>Custom Code</label>
                        <textarea
                          value={event.code}
                          onChange={(e) => handleUpdateEvent(event.id, 'code', e.target.value)}
                          placeholder="// Add custom event handler code"
                          rows={4}
                        />
                      </div>
                    )}

                    <button
                      className="btn-toggle-code"
                      onClick={() => setEditingEvent(editingEvent === event.id ? null : event.id)}
                    >
                      {editingEvent === event.id ? 'Hide Code' : 'Show Code'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-events">No events configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventEditor;
