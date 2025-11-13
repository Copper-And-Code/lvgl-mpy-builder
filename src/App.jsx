import React from 'react';
import Toolbar from './components/Toolbar';
import WidgetPalette from './components/WidgetPalette';
import HierarchyPanel from './components/HierarchyPanel';
import PageManager from './components/PageManager';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import ComponentLibrary from './components/ComponentLibrary';
import PluginManager from './components/PluginManager';
import CloudSyncPanel from './components/CloudSync';
import CollaborationPanel from './components/CollaborationPanel';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <Toolbar />

      <div className="main-container">
        <aside className="left-sidebar">
          <div className="left-sidebar-top">
            <WidgetPalette />
          </div>
          <div className="left-sidebar-middle">
            <HierarchyPanel />
          </div>
          <div className="left-sidebar-bottom">
            <PageManager />
          </div>
        </aside>

        <main className="canvas-area">
          <Canvas />
        </main>

        <aside className="right-sidebar">
          <PropertiesPanel />
        </aside>
      </div>

      <ComponentLibrary />
      <CloudSyncPanel />
      <CollaborationPanel />
      <PluginManager />

      <footer className="status-bar">
        <span>LVGL Visual Editor v2.0.0</span>
        <span>Ready</span>
      </footer>
    </div>
  );
}

export default App;
