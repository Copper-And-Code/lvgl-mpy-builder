import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../core/store';
import { generateCCode } from '../generators/cGenerator';
import { generateMicroPythonCode } from '../generators/micropythonGenerator';
import { getAvailableArchitectures } from '../generators/templateLoader';
import { notify } from '../core/dialogs';
import TemplateEditor from './TemplateEditor';

const CodeExportModal = ({ onClose }) => {
  const { getProjectData, targetArchitecture, setTargetArchitecture } = useStore(
    useShallow((state) => ({
      getProjectData: state.getProjectData,
      targetArchitecture: state.targetArchitecture,
      setTargetArchitecture: state.setTargetArchitecture,
    }))
  );
  const [language, setLanguage] = useState('micropython');
  const [architecture, setArchitecture] = useState(targetArchitecture);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(0); // regenerate after template edits

  // Snapshot of the project when the dialog opens
  const projectData = useMemo(() => getProjectData(), [getProjectData]);
  const availableArchitectures = useMemo(() => getAvailableArchitectures(), []);

  useEffect(() => {
    // Ignore results of a previous language/architecture choice
    let current = true;
    const generateCode = async () => {
      setIsLoading(true);
      try {
        const generatedCode = language === 'c'
          ? await generateCCode(projectData, architecture)
          : await generateMicroPythonCode(projectData, architecture);
        if (current) setCode(generatedCode);
      } catch (error) {
        console.error('Error generating code:', error);
        if (current) setCode(`// Error generating code: ${error.message}`);
      } finally {
        if (current) setIsLoading(false);
      }
    };

    generateCode();
    return () => {
      current = false;
    };
  }, [language, architecture, projectData, templateVersion]);

  // Update store when architecture changes
  useEffect(() => {
    setTargetArchitecture(architecture);
  }, [architecture, setTargetArchitecture]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    notify('Code copied to clipboard!', { kind: 'success' });
  };

  const handleExport = async () => {
    const extension = language === 'c' ? 'c' : 'py';
    const filename = `${projectData.projectName.replace(/\s/g, '_')}_ui.${extension}`;

    if (window.electron) {
      const result = await window.electron.exportCode({
        code,
        filename,
        language,
      });

      if (result.success) {
        notify('Code exported successfully!', { kind: 'success' });
        onClose();
      } else if (result.error) {
        // No error means the user cancelled the save dialog
        notify('Failed to export code: ' + result.error, { kind: 'error' });
      }
    } else {
      // Fallback for browser testing
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Code</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="export-controls">
            <label>
              Language:
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="c">C</option>
                <option value="micropython">MicroPython</option>
              </select>
            </label>

            <label>
              Target Architecture:
              <select value={architecture} onChange={(e) => setArchitecture(e.target.value)}>
                {availableArchitectures.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.name} - {arch.description}
                  </option>
                ))}
              </select>
            </label>

            <div className="export-actions">
              <button className="btn-secondary" onClick={() => setEditingTemplate(true)} title="Customize the code template">
                ✏️ Edit Template
              </button>
              <button className="btn-secondary" onClick={handleCopy} disabled={isLoading}>
                📋 Copy to Clipboard
              </button>
              <button className="btn-primary" onClick={handleExport} disabled={isLoading}>
                💾 Export to File
              </button>
            </div>
          </div>

          <div className="code-preview">
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Generating code...
              </div>
            ) : (
              <pre>
                <code>{code}</code>
              </pre>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {editingTemplate && (
        <TemplateEditor
          language={language}
          architecture={architecture}
          architectureName={availableArchitectures.find((arch) => arch.id === architecture)?.name ?? architecture}
          onClose={() => setEditingTemplate(false)}
          onChange={() => setTemplateVersion((version) => version + 1)}
        />
      )}
    </div>
  );
};

export default CodeExportModal;
