import React, { useState, useEffect, useMemo } from 'react';
import useStore from '../core/store';
import { generateCCode } from '../generators/cGenerator';
import { generateMicroPythonCode } from '../generators/micropythonGenerator';

const CodeExportModal = ({ onClose }) => {
  const { getProjectData } = useStore();
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const projectData = useMemo(() => getProjectData(), []);

  useEffect(() => {
    const generateCode = async () => {
      setIsLoading(true);
      try {
        const generatedCode = language === 'c'
          ? await generateCCode(projectData)
          : await generateMicroPythonCode(projectData);
        setCode(generatedCode);
      } catch (error) {
        console.error('Error generating code:', error);
        setCode(`// Error generating code: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    generateCode();
  }, [language, projectData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
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
        alert('Code exported successfully!');
        onClose();
      } else {
        alert('Failed to export code: ' + (result.error || 'Unknown error'));
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

            <div className="export-actions">
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
    </div>
  );
};

export default CodeExportModal;
