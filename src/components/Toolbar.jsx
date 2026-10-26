import { useState, useEffect, useEffectEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore, { selectCanRedo, selectCanUndo, selectCanvasSize } from '../core/store';
import { notify, showAlert, showConfirm, warningsMessage } from '../core/dialogs';
import CodeExportModal from './CodeExportModal';
import TemplateSelector from './TemplateSelector';
import AssetManager from './AssetManager';
import SettingsDialog from './SettingsDialog';
import VariablesDialog from './VariablesDialog';

const Toolbar = () => {
  const canvasSize = useStore(selectCanvasSize);
  const canUndo = useStore(selectCanUndo);
  const canRedo = useStore(selectCanRedo);
  const {
    projectName,
    setProjectName,
    setCanvasSize,
    displayPresets,
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
  } = useStore(
    useShallow((state) => ({
      projectName: state.projectName,
      setProjectName: state.setProjectName,
      setCanvasSize: state.setCanvasSize,
      displayPresets: state.displayPresets,
      zoom: state.zoom,
      setZoom: state.setZoom,
      gridEnabled: state.gridEnabled,
      toggleGrid: state.toggleGrid,
      snapToGrid: state.snapToGrid,
      toggleSnapToGrid: state.toggleSnapToGrid,
      undo: state.undo,
      redo: state.redo,
      clearProject: state.clearProject,
      getProjectData: state.getProjectData,
      loadProject: state.loadProject,
    }))
  );

  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  // Width/height being typed; reset when the page size changes (preset, page switch, load)
  const [sizeInputs, setSizeInputs] = useState({ width: canvasSize.width, height: canvasSize.height, for: canvasSize });
  if (sizeInputs.for !== canvasSize) {
    setSizeInputs({ width: canvasSize.width, height: canvasSize.height, for: canvasSize });
  }
  const customWidth = sizeInputs.width;
  const customHeight = sizeInputs.height;
  const setCustomWidth = (width) => setSizeInputs((inputs) => ({ ...inputs, width }));
  const setCustomHeight = (height) => setSizeInputs((inputs) => ({ ...inputs, height }));

  const handleNewProject = async () => {
    const confirmed = await showConfirm('Create a new project? Unsaved changes will be lost.', {
      confirmLabel: 'New project',
      danger: true,
    });
    if (confirmed) clearProject();
  };

  const handleSaveProject = async () => {
    if (window.electron) {
      const projectData = getProjectData();
      const result = await window.electron.saveProject(projectData);
      if (result.success) {
        notify('Project saved', { kind: 'success' });
      } else if (result.error) {
        notify('Failed to save project: ' + result.error, { kind: 'error' });
      }
    } else {
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
        try {
          const warnings = loadProject(result.data);
          if (warnings.length) {
            showAlert(warningsMessage(`The project was loaded with ${warnings.length} correction(s):`, warnings));
          } else {
            notify('Project loaded', { kind: 'success' });
          }
        } catch (error) {
          notify('Failed to load project: ' + error.message, { kind: 'error' });
        }
      } else if (result.error) {
        notify('Failed to load project: ' + result.error, { kind: 'error' });
      }
    } else {
      notify('Loading projects is available in the desktop app', { kind: 'info' });
    }
  };

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleZoomReset = () => setZoom(1);

  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    if (presetName === 'custom') return;
    const preset = displayPresets.find(p => p.name === presetName);
    if (preset) {
      setCanvasSize({ width: preset.width, height: preset.height });
    }
  };

  const handleCustomSizeApply = () => {
    const w = Math.max(64, Math.min(4096, parseInt(customWidth) || 1024));
    const h = Math.max(64, Math.min(4096, parseInt(customHeight) || 600));
    setCanvasSize({ width: w, height: h });
  };

  const handleSizeKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomSizeApply();
    }
  };

  // Find matching preset
  const currentPreset = displayPresets.find(
    p => p.width === canvasSize.width && p.height === canvasSize.height
  );

  // Menu commands from Electron: the event function always sees the current
  // state (e.g. zoom), and the listener is registered once and removed on unmount
  const onMenuCommand = useEffectEvent((command) => {
    const actions = {
      'menu-new-project': handleNewProject,
      'menu-open-project': handleLoadProject,
      'menu-save-project': handleSaveProject,
      'menu-export-code': () => setShowExportModal(true),
      'menu-undo': undo,
      'menu-redo': redo,
      'menu-zoom-in': handleZoomIn,
      'menu-zoom-out': handleZoomOut,
      'menu-zoom-reset': handleZoomReset,
      'menu-toggle-grid': toggleGrid,
    };
    actions[command]?.();
  });

  useEffect(() => window.electron?.onMenuCommand?.((command) => onMenuCommand(command)), []);

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
            New
          </button>
          <button className="toolbar-btn" onClick={handleSaveProject} title="Save Project">
            Save
          </button>
          <button className="toolbar-btn" onClick={handleLoadProject} title="Load Project">
            Load
          </button>
        </div>

        <div className="toolbar-section toolbar-divider">
          <button className="toolbar-btn" onClick={undo} title="Undo" disabled={!canUndo}>Undo</button>
          <button className="toolbar-btn" onClick={redo} title="Redo" disabled={!canRedo}>Redo</button>
        </div>

        {/* Display size controls */}
        <div className="toolbar-section toolbar-divider">
          <div className="display-size-controls">
            <select
              className="display-preset-select"
              value={currentPreset ? currentPreset.name : 'custom'}
              onChange={handlePresetChange}
              title="Display preset"
            >
              {displayPresets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
              {!currentPreset && <option value="custom">Custom</option>}
            </select>
            <input
              type="number"
              className="canvas-size-input"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              onBlur={handleCustomSizeApply}
              onKeyDown={handleSizeKeyDown}
              title="Canvas width"
              min="64"
              max="4096"
            />
            <span className="canvas-size-separator">x</span>
            <input
              type="number"
              className="canvas-size-input"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              onBlur={handleCustomSizeApply}
              onKeyDown={handleSizeKeyDown}
              title="Canvas height"
              min="64"
              max="4096"
            />
          </div>
        </div>

        <div className="toolbar-section toolbar-divider">
          <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">+</button>
          <button className="toolbar-btn" onClick={handleZoomReset} title="Reset Zoom">1:1</button>
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
            Templates
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setShowAssetManager(true)}
            title="Manage Assets"
          >
            Assets
          </button>
          <button className="toolbar-btn" onClick={() => setShowVariables(true)} title="Variables for data binding">
            Variables
          </button>
          <button className="toolbar-btn" onClick={() => setShowSettings(true)} title="Editor settings">
            Settings
          </button>
        </div>

        <div className="toolbar-section">
          <button
            className="toolbar-btn btn-primary"
            onClick={() => setShowExportModal(true)}
            title="Export Code"
          >
            Export Code
          </button>
        </div>
      </div>

      {showExportModal && <CodeExportModal onClose={() => setShowExportModal(false)} />}
      {showTemplateSelector && <TemplateSelector onClose={() => setShowTemplateSelector(false)} />}
      {showAssetManager && <AssetManager onClose={() => setShowAssetManager(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showVariables && <VariablesDialog onClose={() => setShowVariables(false)} />}
    </>
  );
};

export default Toolbar;
