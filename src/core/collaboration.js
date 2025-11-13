/**
 * Collaborative Editing v2.0
 * Real-time multi-user editing with WebSocket support
 */

class CollaborationSystem {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.userId = null;
    this.userName = 'Anonymous';
    this.users = new Map();
    this.isConnected = false;
    this.serverUrl = null;
    this.eventHandlers = new Map();
    this.cursors = new Map();
    this.pendingChanges = [];
  }

  /**
   * Generate a unique user ID
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Connect to collaboration server
   */
  async connect(serverUrl, sessionId, userName = 'Anonymous') {
    if (this.isConnected) {
      throw new Error('Already connected');
    }

    this.serverUrl = serverUrl;
    this.sessionId = sessionId;
    this.userName = userName;
    this.userId = this.generateUserId();

    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, use WebSocket
        // For demo purposes, we'll simulate the connection
        console.log(`Connecting to ${serverUrl} session ${sessionId}...`);

        // Simulate WebSocket connection
        this.socket = {
          readyState: 1, // OPEN
          send: (data) => {
            console.log('Sending:', data);
            // In real implementation, this would send via WebSocket
          },
          close: () => {
            console.log('Socket closed');
          },
        };

        this.isConnected = true;

        // Simulate successful connection
        setTimeout(() => {
          this.emit('connected', {
            userId: this.userId,
            sessionId: this.sessionId,
          });
          resolve();
        }, 100);

        /*
        // Real WebSocket implementation:
        this.socket = new WebSocket(serverUrl);

        this.socket.onopen = () => {
          // Join session
          this.send('join', {
            sessionId: this.sessionId,
            userId: this.userId,
            userName: this.userName,
          });

          this.isConnected = true;
          this.emit('connected', { userId: this.userId, sessionId: this.sessionId });
          resolve();
        };

        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };

        this.socket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
        };
        */
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (!this.isConnected) return;

    if (this.socket) {
      this.send('leave', {
        userId: this.userId,
        sessionId: this.sessionId,
      });

      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    this.users.clear();
    this.cursors.clear();
    this.emit('disconnected');
  }

  /**
   * Send message to server
   */
  send(type, data) {
    if (!this.isConnected || !this.socket) {
      console.warn('Not connected, queueing change');
      this.pendingChanges.push({ type, data });
      return;
    }

    const message = {
      type,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data,
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    switch (message.type) {
      case 'user:joined':
        this.handleUserJoined(message.data);
        break;
      case 'user:left':
        this.handleUserLeft(message.data);
        break;
      case 'user:list':
        this.handleUserList(message.data);
        break;
      case 'widget:created':
      case 'widget:updated':
      case 'widget:deleted':
        this.emit('widget:change', message.data);
        break;
      case 'cursor:moved':
        this.handleCursorMoved(message.data);
        break;
      case 'selection:changed':
        this.emit('selection:changed', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Handle user joined event
   */
  handleUserJoined(data) {
    this.users.set(data.userId, {
      id: data.userId,
      name: data.userName,
      color: this.generateUserColor(data.userId),
      joinedAt: Date.now(),
    });

    this.emit('user:joined', this.users.get(data.userId));
  }

  /**
   * Handle user left event
   */
  handleUserLeft(data) {
    const user = this.users.get(data.userId);
    this.users.delete(data.userId);
    this.cursors.delete(data.userId);

    if (user) {
      this.emit('user:left', user);
    }
  }

  /**
   * Handle user list
   */
  handleUserList(data) {
    data.users.forEach(user => {
      this.users.set(user.userId, {
        id: user.userId,
        name: user.userName,
        color: this.generateUserColor(user.userId),
        joinedAt: Date.now(),
      });
    });

    this.emit('users:updated', Array.from(this.users.values()));
  }

  /**
   * Handle cursor movement
   */
  handleCursorMoved(data) {
    if (data.userId !== this.userId) {
      this.cursors.set(data.userId, {
        x: data.x,
        y: data.y,
        userId: data.userId,
      });

      this.emit('cursor:moved', data);
    }
  }

  /**
   * Broadcast widget creation
   */
  broadcastWidgetCreated(widget) {
    this.send('widget:created', { widget });
  }

  /**
   * Broadcast widget update
   */
  broadcastWidgetUpdated(widgetId, changes) {
    this.send('widget:updated', { widgetId, changes });
  }

  /**
   * Broadcast widget deletion
   */
  broadcastWidgetDeleted(widgetId) {
    this.send('widget:deleted', { widgetId });
  }

  /**
   * Broadcast cursor position
   */
  broadcastCursor(x, y) {
    this.send('cursor:moved', { x, y });
  }

  /**
   * Broadcast selection change
   */
  broadcastSelection(widgetId) {
    this.send('selection:changed', { widgetId });
  }

  /**
   * Generate user color based on userId
   */
  generateUserColor(userId) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E76F51', '#2A9D8F',
    ];

    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Get list of connected users
   */
  getUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Get user cursors
   */
  getCursors() {
    return Array.from(this.cursors.values());
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);

    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;

    this.eventHandlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      userId: this.userId,
      userName: this.userName,
      sessionId: this.sessionId,
      userCount: this.users.size,
    };
  }
}

// Create singleton instance
const collaboration = new CollaborationSystem();

export default collaboration;

// Example server message format for documentation:
export const messageExamples = {
  // Client -> Server: Join session
  join: {
    type: 'join',
    userId: 'user_123',
    sessionId: 'session_abc',
    data: {
      userName: 'John Doe',
    },
  },

  // Server -> Client: User joined
  userJoined: {
    type: 'user:joined',
    data: {
      userId: 'user_123',
      userName: 'John Doe',
    },
  },

  // Client -> Server: Widget created
  widgetCreated: {
    type: 'widget:created',
    userId: 'user_123',
    sessionId: 'session_abc',
    timestamp: 1234567890,
    data: {
      widget: {
        id: 'widget_1',
        type: 'button',
        props: { x: 100, y: 50 },
      },
    },
  },

  // Client -> Server: Cursor moved
  cursorMoved: {
    type: 'cursor:moved',
    userId: 'user_123',
    sessionId: 'session_abc',
    timestamp: 1234567890,
    data: {
      x: 250,
      y: 180,
    },
  },
};
