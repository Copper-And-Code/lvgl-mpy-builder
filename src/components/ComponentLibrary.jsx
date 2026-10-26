import { useState } from 'react';
import useStore from '../core/store';
import { Package, Plus, Trash2, Download, Upload, Search, Tag, BookOpen } from 'lucide-react';
import { componentTemplates, getTemplatesByCategory } from '../core/componentTemplates';
import '../styles/ComponentLibrary.css';

export default function ComponentLibrary() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentTags, setComponentTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'saved'

  const componentLibrary = useStore((state) => state.componentLibrary);
  const saveAsComponent = useStore((state) => state.saveAsComponent);
  const deleteComponent = useStore((state) => state.deleteComponent);
  const insertComponent = useStore((state) => state.insertComponent);
  const insertWidgets = useStore((state) => state.insertWidgets);
  const exportComponentLibrary = useStore((state) => state.exportComponentLibrary);
  const importComponentLibrary = useStore((state) => state.importComponentLibrary);
  const selectedWidgetId = useStore((state) => state.selectedWidgetId);

  const handleSaveComponent = () => {
    if (!componentName.trim()) {
      alert('Please enter a component name');
      return;
    }

    const tags = componentTags.split(',').map(t => t.trim()).filter(t => t);
    saveAsComponent(componentName, componentDescription, tags);

    setComponentName('');
    setComponentDescription('');
    setComponentTags('');
    setShowSaveDialog(false);
  };

  const handleInsertComponent = (componentId) => {
    insertComponent(componentId, { x: 50, y: 50 });
  };

  const handleInsertTemplate = (template) => {
    // One undo step; widgets get new ids and unique names
    insertWidgets(template.widgets, { x: 50, y: 50 });
  };

  const handleExportLibrary = () => {
    const data = exportComponentLibrary();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLibrary = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const warnings = importComponentLibrary(data);
        if (warnings.length) alert(`Library imported with ${warnings.length} correction(s):\n- ${warnings.slice(0, 10).join('\n- ')}`);
      } catch (err) {
        alert('Invalid component library file');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const filteredComponents = componentLibrary.filter(component => {
    const query = searchQuery.toLowerCase();
    return (
      component.name.toLowerCase().includes(query) ||
      component.description.toLowerCase().includes(query) ||
      component.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const filteredTemplates = componentTemplates.filter(template => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const templatesByCategory = getTemplatesByCategory();

  return (
    <>
      <button
        className="component-library-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Component Library"
      >
        <Package size={20} />
      </button>

      {isOpen && (
        <div className="component-library-panel">
          <div className="component-library-header">
            <h3>
              <Package size={18} />
              Component Library
            </h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="component-library-tabs">
            <button
              className={activeTab === 'templates' ? 'active' : ''}
              onClick={() => setActiveTab('templates')}
            >
              <BookOpen size={16} />
              Templates
            </button>
            <button
              className={activeTab === 'saved' ? 'active' : ''}
              onClick={() => setActiveTab('saved')}
            >
              <Package size={16} />
              My Components
            </button>
          </div>

          {activeTab === 'saved' && (
            <div className="component-library-toolbar">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!selectedWidgetId}
                title="Save selected widget as component"
              >
                <Plus size={16} />
                Save Component
              </button>
              <button onClick={handleExportLibrary} title="Export library">
                <Download size={16} />
              </button>
              <label className="import-button" title="Import library">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportLibrary}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          <div className="component-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={activeTab === 'templates' ? 'Search templates...' : 'Search components...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="component-list">
            {activeTab === 'templates' ? (
              // Templates view
              searchQuery ? (
                // Filtered templates
                filteredTemplates.length === 0 ? (
                  <div className="component-empty">
                    <p>No templates found</p>
                    <p>Try a different search term</p>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div key={template.id} className="component-item template-item">
                      <div className="component-info">
                        <h4>
                          <span className="template-icon">{template.icon}</span>
                          {template.name}
                        </h4>
                        {template.description && (
                          <p className="component-description">{template.description}</p>
                        )}
                        {template.tags.length > 0 && (
                          <div className="component-tags">
                            {template.tags.map((tag, idx) => (
                              <span key={idx} className="component-tag">
                                <Tag size={12} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="component-meta">
                          {template.widgets.length} widget{template.widgets.length !== 1 ? 's' : ''}
                          {template.category && ` • ${template.category}`}
                        </div>
                      </div>
                      <div className="component-actions">
                        <button
                          onClick={() => handleInsertTemplate(template)}
                          title="Insert template"
                          className="btn-insert"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Templates by category
                Object.entries(templatesByCategory).map(([category, templates]) => (
                  <div key={category} className="template-category">
                    <h4 className="category-title">{category}</h4>
                    {templates.map((template) => (
                      <div key={template.id} className="component-item template-item">
                        <div className="component-info">
                          <h4>
                            <span className="template-icon">{template.icon}</span>
                            {template.name}
                          </h4>
                          {template.description && (
                            <p className="component-description">{template.description}</p>
                          )}
                          {template.tags.length > 0 && (
                            <div className="component-tags">
                              {template.tags.map((tag, idx) => (
                                <span key={idx} className="component-tag">
                                  <Tag size={12} />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="component-meta">
                            {template.widgets.length} widget{template.widgets.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="component-actions">
                          <button
                            onClick={() => handleInsertTemplate(template)}
                            title="Insert template"
                            className="btn-insert"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )
            ) : (
              // Saved components view
              filteredComponents.length === 0 ? (
                <div className="component-empty">
                  <p>No components yet</p>
                  <p>Select a widget and click “Save Component”</p>
                </div>
              ) : (
                filteredComponents.map((component) => (
                  <div key={component.id} className="component-item">
                    <div className="component-info">
                      <h4>{component.name}</h4>
                      {component.description && (
                        <p className="component-description">{component.description}</p>
                      )}
                      {component.tags.length > 0 && (
                        <div className="component-tags">
                          {component.tags.map((tag, idx) => (
                            <span key={idx} className="component-tag">
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="component-meta">
                        {component.widgets.length} widget{component.widgets.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="component-actions">
                      <button
                        onClick={() => handleInsertComponent(component.id)}
                        title="Insert component"
                        className="btn-insert"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete component "${component.name}"?`)) {
                            deleteComponent(component.id);
                          }
                        }}
                        title="Delete component"
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="component-save-dialog-overlay">
          <div className="component-save-dialog">
            <h3>Save as Component</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="My Component"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={componentDescription}
                onChange={(e) => setComponentDescription(e.target.value)}
                placeholder="Describe what this component does..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={componentTags}
                onChange={(e) => setComponentTags(e.target.value)}
                placeholder="button, ui, navigation"
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button onClick={handleSaveComponent} className="btn-primary">
                Save Component
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
