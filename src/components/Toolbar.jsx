import React, { useState, useEffect } from 'react';
import useStore from '../core/store';
import CodeExportModal from './CodeExportModal';
import TemplateSelector from './TemplateSelector';
import AssetManager from './AssetManager';

const Toolbar = () => {
  const {
    projectName,
    setProjectName,
    zoom,
    setZoom,
    gridEnabled,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    undo,
    redo,
    clearProject,
    getProjectData,
    loadProject,
  } = useStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);

  const handleNewProject = () => {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      clearProject();
    }
  };

  const handleSaveProject = async () => {
    if (window.electron) {
      const projectData = getProjectData();
      const result = await window.electron.saveProject(projectData);
      if (result.success) {
        alert('Project saved successfully!');
      } else {
        alert('Failed to save project: ' + (result.error || 'Unknown error'));
      }
    } else {
      // Fallback for browser testing
      const projectData = getProjectData();
      const dataStr = JSON.stringify(projectData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${projectName.replace(/\s/g, '_')}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleLoadProject = async () => {
    if (window.electron) {
      const result = await window.electron.loadProject();
      if (result.success) {
        loadProject(result.data);
        alert('Project loaded successfully!');
      } else if (result.error) {
        alert('Failed to load project: ' + result.error);
      }
    } else {
      alert('Load project is only available in Electron app');
    }
  };

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleZoomReset = () => setZoom(1);

  // Handle menu commands from Electron
  useEffect(() => {
    if (window.electron && window.electron.onMenuCommand) {
      window.electron.onMenuCommand((command) => {
        switch (command) {
          case 'menu-new-project':
            handleNewProject();
            break;
          case 'menu-open-project':
            handleLoadProject();
            break;
          case 'menu-save-project':
            handleSaveProject();
            break;
          case 'menu-export-code':
            setShowExportModal(true);
            break;
          case 'menu-undo':
            undo();
            break;
          case 'menu-redo':
            redo();
            break;
          case 'menu-zoom-in':
            handleZoomIn();
            break;
          case 'menu-zoom-out':
            handleZoomOut();
            break;
          case 'menu-zoom-reset':
            handleZoomReset();
            break;
          case 'menu-toggle-grid':
            toggleGrid();
            break;
          default:
            console.log('Unknown menu command:', command);
        }
      });
    }
  }, []);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-section">
          <h2 className="app-title">LVGL Editor</h2>
          <input
            type="text"
            className="project-name-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
          />
        </div>

        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={handleNewProject} title="New Project">
            📄 New
          </button>
          <button className="toolbar-btn" onClick={handleSaveProject} title="Save Project">
            💾 Save
          </button>
          <button className="toolbar-btn" onClick={handleLoadProject} title="Load Project">
            📂 Load
          </button>
        </div>

        <div className="toolbar-section toolbar-divider">
          <button className="toolbar-btn" onClick={undo} title="Undo">
            ↶ Undo
          </button>
          <button className="toolbar-btn" onClick={redo} title="Redo">
            ↷ Redo
          </button>
        </div>

        <div className="toolbar-section toolbar-divider">
          <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
            🔍−
          </button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
            🔍+
          </button>
          <button className="toolbar-btn" onClick={handleZoomReset} title="Reset Zoom">
            Reset
          </button>
        </div>

        <div className="toolbar-section toolbar-divider">
          <label className="toolbar-checkbox">
            <input type="checkbox" checked={gridEnabled} onChange={toggleGrid} />
            Grid
          </label>
          <label className="toolbar-checkbox">
            <input type="checkbox" checked={snapToGrid} onChange={toggleSnapToGrid} />
            Snap
          </label>
        </div>

        <div className="toolbar-section toolbar-divider">
          <button
            className="toolbar-btn"
            onClick={() => setShowTemplateSelector(true)}
            title="Apply Screen Template"
          >
            📐 Templates
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setShowAssetManager(true)}
            title="Manage Assets"
          >
            🖼️ Assets
          </button>
        </div>

        <div className="toolbar-section">
          <button
            className="toolbar-btn btn-primary"
            onClick={() => setShowExportModal(true)}
            title="Export Code"
          >
            📤 Export Code
          </button>
        </div>
      </div>

      {showExportModal && <CodeExportModal onClose={() => setShowExportModal(false)} />}
      {showTemplateSelector && <TemplateSelector onClose={() => setShowTemplateSelector(false)} />}
      {showAssetManager && <AssetManager onClose={() => setShowAssetManager(false)} />}
    </>
  );
};

export default Toolbar;
