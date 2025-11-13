import React from 'react';
import Toolbar from './components/Toolbar';
import WidgetPalette from './components/WidgetPalette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <Toolbar />

      <div className="main-container">
        <aside className="left-sidebar">
          <WidgetPalette />
        </aside>

        <main className="canvas-area">
          <Canvas />
        </main>

        <aside className="right-sidebar">
          <PropertiesPanel />
        </aside>
      </div>

      <footer className="status-bar">
        <span>LVGL Visual Editor v1.0.0</span>
        <span>Ready</span>
      </footer>
    </div>
  );
}

export default App;
