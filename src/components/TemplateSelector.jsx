import { useState } from 'react';
import useStore from '../core/store';
import { Layout, X } from 'lucide-react';
import '../styles/TemplateSelector.css';

function TemplateSelector({ onClose }) {
  const { applyTemplate, getAvailableTemplates } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const templates = getAvailableTemplates();

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Layout size={20} />
            Select Screen Template
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-preview">
                  <div className={`preview-content preview-${template.id}`}>
                    {template.id === 'blank' && <div className="preview-blank">Empty</div>}
                    {template.id === 'dashboard' && (
                      <>
                        <div className="preview-panel"></div>
                        <div className="preview-label"></div>
                        <div className="preview-button"></div>
                      </>
                    )}
                    {template.id === 'settings' && (
                      <>
                        <div className="preview-label-small"></div>
                        <div className="preview-switch"></div>
                        <div className="preview-slider"></div>
                      </>
                    )}
                    {template.id === 'list' && (
                      <>
                        <div className="preview-list-item"></div>
                        <div className="preview-list-item"></div>
                        <div className="preview-list-item"></div>
                      </>
                    )}
                  </div>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
