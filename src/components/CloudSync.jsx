import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Upload, Download, Trash2 } from 'lucide-react';
import cloudSync from '../core/cloudSync';
import useStore from '../core/store';
import '../styles/CloudSync.css';
import { notify, showConfirm } from '../core/dialogs';
import { ExperimentalBadge, ExperimentalNotice } from './ExperimentalNotice';

export default function CloudSyncPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(cloudSync.getStatus());
  const [providers] = useState(() => cloudSync.getProviders());
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [cloudProjects, setCloudProjects] = useState([]);
  const [apiKey, setApiKey] = useState('');

  const getProjectData = useStore((state) => state.getProjectData);
  const loadProject = useStore((state) => state.loadProject);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(cloudSync.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!selectedProvider) {
      notify('Please select a provider', { kind: 'error' });
      return;
    }

    try {
      await cloudSync.setActiveProvider(selectedProvider, { apiKey });
      setStatus(cloudSync.getStatus());
      setShowConnectDialog(false);
      notify('Connected successfully', { kind: 'success' });
    } catch (error) {
      notify(`Connection failed: ${error.message}`, { kind: 'error' });
    }
  };

  const handleDisconnect = async () => {
    try {
      await cloudSync.disconnect();
      setStatus(cloudSync.getStatus());
    } catch (error) {
      notify(`Disconnect failed: ${error.message}`, { kind: 'error' });
    }
  };

  const handleSaveToCloud = async () => {
    try {
      const projectData = getProjectData();
      await cloudSync.saveProject(projectData);
      setStatus(cloudSync.getStatus());
      notify('Project saved to cloud', { kind: 'success' });
    } catch (error) {
      notify(`Save failed: ${error.message}`, { kind: 'error' });
    }
  };

  const handleLoadFromCloud = async () => {
    try {
      const projects = await cloudSync.listProjects();
      setCloudProjects(projects);
      setShowProjectsDialog(true);
    } catch (error) {
      notify(`Failed to load projects: ${error.message}`, { kind: 'error' });
    }
  };

  const handleLoadProject = async (projectId) => {
    try {
      const projectData = await cloudSync.loadProject(projectId);
      loadProject(projectData);
      setShowProjectsDialog(false);
      notify('Project loaded from cloud', { kind: 'success' });
    } catch (error) {
      notify(`Load failed: ${error.message}`, { kind: 'error' });
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!(await showConfirm('Delete this project from the cloud?', { confirmLabel: 'Delete', danger: true }))) return;

    try {
      await cloudSync.deleteProject(projectId);
      const projects = await cloudSync.listProjects();
      setCloudProjects(projects);
      notify('Project deleted', { kind: 'success' });
    } catch (error) {
      notify(`Delete failed: ${error.message}`, { kind: 'error' });
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected': return '#4CAF50';
      case 'syncing': return '#2196F3';
      case 'error': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected': return 'Connected';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <>
      <button
        className="cloud-sync-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Cloud Sync"
        style={{ background: getStatusColor() }}
      >
        {status.status === 'connected' || status.status === 'syncing' ? (
          <Cloud size={20} />
        ) : (
          <CloudOff size={20} />
        )}
      </button>

      {isOpen && (
        <div className="cloud-sync-panel">
          <div className="cloud-sync-header">
            <h3>
              <Cloud size={18} />
              Cloud Sync
              <ExperimentalBadge />
            </h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <ExperimentalNotice feature="cloudSync" />

          <div className="cloud-status">
            <div className="status-indicator" style={{ background: getStatusColor() }} />
            <div className="status-info">
              <div className="status-text">{getStatusText()}</div>
              {status.provider && (
                <div className="status-provider">Provider: {status.provider}</div>
              )}
              {status.lastSync && (
                <div className="status-time">
                  Last sync: {new Date(status.lastSync).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {status.status === 'disconnected' ? (
            <div className="cloud-connect-section">
              <p>Connect to a cloud provider to sync your projects</p>
              <button
                onClick={() => setShowConnectDialog(true)}
                className="btn-primary"
              >
                <Cloud size={16} />
                Connect to Cloud
              </button>
            </div>
          ) : (
            <>
              <div className="cloud-actions">
                <button onClick={handleSaveToCloud} title="Save to cloud">
                  <Upload size={16} />
                  Save to Cloud
                </button>
                <button onClick={handleLoadFromCloud} title="Load from cloud">
                  <Download size={16} />
                  Load from Cloud
                </button>
              </div>

              <div className="cloud-disconnect">
                <button onClick={handleDisconnect} className="btn-disconnect">
                  <CloudOff size={16} />
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showConnectDialog && (
        <div className="cloud-dialog-overlay">
          <div className="cloud-dialog">
            <h3>Connect to Cloud</h3>

            <div className="provider-list">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`provider-item ${selectedProvider === provider.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="provider-icon">{provider.icon}</div>
                  <div className="provider-info">
                    <h4>{provider.name}</h4>
                    <p>{provider.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedProvider && selectedProvider !== 'local-storage' && (
              <div className="form-group">
                <label>API Key (optional)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>
            )}

            <div className="dialog-actions">
              <button onClick={() => setShowConnectDialog(false)}>Cancel</button>
              <button onClick={handleConnect} className="btn-primary">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectsDialog && (
        <div className="cloud-dialog-overlay">
          <div className="cloud-dialog">
            <h3>Load Project from Cloud</h3>

            <div className="project-list">
              {cloudProjects.length === 0 ? (
                <div className="project-empty">
                  <p>No projects in cloud</p>
                </div>
              ) : (
                cloudProjects.map((project) => (
                  <div key={project.id} className="project-item">
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      <div className="project-meta">
                        <span>v{project.version}</span>
                        <span>{new Date(project.savedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="project-actions">
                      <button
                        onClick={() => handleLoadProject(project.id)}
                        title="Load project"
                        className="btn-load"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="dialog-actions">
              <button onClick={() => setShowProjectsDialog(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
