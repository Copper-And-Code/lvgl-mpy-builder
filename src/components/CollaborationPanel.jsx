import { useState, useEffect } from 'react';
import { Users, UserPlus, Link, Unlink, Circle } from 'lucide-react';
import collaboration from '../core/collaboration';
import '../styles/CollaborationPanel.css';

export default function CollaborationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(collaboration.getStatus());
  const [users, setUsers] = useState([]);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://localhost:3001');
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(() => {
      setStatus(collaboration.getStatus());
      setUsers(collaboration.getUsers());
    }, 1000);

    // Register event handlers
    const handleUserJoined = (user) => {
      console.log('User joined:', user);
      setUsers(collaboration.getUsers());
    };

    const handleUserLeft = (user) => {
      console.log('User left:', user);
      setUsers(collaboration.getUsers());
    };

    const handleUsersUpdated = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    collaboration.on('user:joined', handleUserJoined);
    collaboration.on('user:left', handleUserLeft);
    collaboration.on('users:updated', handleUsersUpdated);

    return () => {
      clearInterval(interval);
      collaboration.off('user:joined', handleUserJoined);
      collaboration.off('user:left', handleUserLeft);
      collaboration.off('users:updated', handleUsersUpdated);
    };
  }, []);

  const handleConnect = async () => {
    if (!serverUrl.trim() || !sessionId.trim()) {
      alert('Please enter server URL and session ID');
      return;
    }

    try {
      await collaboration.connect(serverUrl, sessionId, userName);
      setStatus(collaboration.getStatus());
      setShowConnectDialog(false);
      alert('Connected to collaboration session');
    } catch (error) {
      alert(`Connection failed: ${error.message}`);
    }
  };

  const handleDisconnect = () => {
    collaboration.disconnect();
    setStatus(collaboration.getStatus());
    setUsers([]);
  };

  const generateSessionId = () => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setSessionId(id);
  };

  return (
    <>
      <button
        className="collaboration-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Collaboration"
        style={{
          background: status.connected ? '#4CAF50' : '#999',
        }}
      >
        <Users size={20} />
        {status.userCount > 0 && (
          <span className="user-count-badge">{status.userCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="collaboration-panel">
          <div className="collaboration-header">
            <h3>
              <Users size={18} />
              Collaboration
            </h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="collaboration-status">
            <div className="status-row">
              <Circle
                size={12}
                fill={status.connected ? '#4CAF50' : '#999'}
                stroke="none"
              />
              <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {status.connected && (
              <>
                <div className="status-detail">
                  Session: <code>{status.sessionId}</code>
                </div>
                <div className="status-detail">
                  You: {status.userName}
                </div>
              </>
            )}
          </div>

          {!status.connected ? (
            <div className="collaboration-connect-section">
              <p>Start or join a collaboration session</p>
              <button
                onClick={() => setShowConnectDialog(true)}
                className="btn-primary"
              >
                <Link size={16} />
                Join Session
              </button>
            </div>
          ) : (
            <>
              <div className="users-section">
                <h4>Active Users ({users.length})</h4>
                <div className="users-list">
                  {users.length === 0 ? (
                    <div className="users-empty">
                      <p>Only you in this session</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="user-item">
                        <div
                          className="user-color"
                          style={{ background: user.color }}
                        />
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          {user.id === status.userId && (
                            <span className="user-badge">You</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="collaboration-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(status.sessionId);
                    alert('Session ID copied to clipboard');
                  }}
                  title="Copy session ID"
                >
                  📋 Copy Session ID
                </button>
              </div>

              <div className="collaboration-disconnect">
                <button onClick={handleDisconnect} className="btn-disconnect">
                  <Unlink size={16} />
                  Leave Session
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showConnectDialog && (
        <div className="collaboration-dialog-overlay">
          <div className="collaboration-dialog">
            <h3>Join Collaboration Session</h3>

            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Server URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="ws://localhost:3001"
              />
              <p className="form-hint">
                WebSocket server URL for real-time collaboration
              </p>
            </div>

            <div className="form-group">
              <label>Session ID</label>
              <div className="session-id-input">
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter or generate session ID"
                />
                <button onClick={generateSessionId} title="Generate new session ID">
                  <UserPlus size={16} />
                </button>
              </div>
              <p className="form-hint">
                Create a new session or join an existing one
              </p>
            </div>

            <div className="info-box">
              <strong>Note:</strong> This is a demo implementation. In production,
              you would need a WebSocket server running to enable real-time
              collaboration.
            </div>

            <div className="dialog-actions">
              <button onClick={() => setShowConnectDialog(false)}>Cancel</button>
              <button onClick={handleConnect} className="btn-primary">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
