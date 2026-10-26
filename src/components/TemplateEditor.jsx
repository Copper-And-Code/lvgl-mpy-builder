import { useEffect, useState } from 'react';
import { notify, showConfirm } from '../core/dialogs';
import { getTemplateSource, resetTemplate, saveTemplateSource } from '../generators/templateLoader';
import '../styles/TemplateEditor.css';

const LANGUAGE_NAMES = { c: 'C', micropython: 'MicroPython' };

/**
 * Editor of the code template of one language and architecture. Customized
 * templates are saved in the app's data folder; the bundled ones stay as
 * they are and are used again after a reset.
 */
export default function TemplateEditor({ language, architecture, architectureName, onClose, onChange }) {
  const [template, setTemplate] = useState(null); // { source, customized, editable }
  const [source, setSource] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getTemplateSource(language, architecture)
      .then((loaded) => {
        if (!active) return;
        setTemplate(loaded);
        setSource(loaded.source);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [language, architecture]);

  const modified = template !== null && source !== template.source;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveTemplateSource(language, architecture, source);
      setTemplate({ ...template, source, customized: true });
      notify('Template saved', { kind: 'success' });
      onChange();
    } catch (e) {
      // e.g. a Handlebars syntax error reported by the main process
      setError(e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    const confirmed = await showConfirm('Discard your changes and use the bundled template again?', {
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await resetTemplate(language, architecture);
      const loaded = await getTemplateSource(language, architecture);
      setTemplate(loaded);
      setSource(loaded.source);
      setError(null);
      notify('Template reset to the bundled version', { kind: 'success' });
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (modified && !(await showConfirm('Discard the unsaved changes to the template?', { confirmLabel: 'Discard' }))) return;
    onClose();
  };

  return (
    // Inside the export dialog's overlay: keep clicks from closing it
    <div className="modal-overlay template-editor-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content template-editor" role="dialog" aria-labelledby="template-editor-title">
        <div className="modal-header">
          <h2 id="template-editor-title">
            {LANGUAGE_NAMES[language]} template · {architectureName}
            {template?.customized && <span className="template-editor-badge">customized</span>}
          </h2>
          <button className="modal-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {template && !template.editable && (
            <p className="template-editor-note">Templates can be customized in the desktop app.</p>
          )}
          <p className="template-editor-help">
            Handlebars template. Main variables: <code>{'{{declarations}}'}</code>, <code>{'{{#each pages}}'}</code> with{' '}
            <code>{'{{this.functionName}}'}</code> and <code>{'{{#each this.widgets}}'}</code>,{' '}
            <code>{'{{#each eventCallbacks}}'}</code> with <code>{'{{this.name}}'}</code> and{' '}
            <code>{'{{indent this.body 4}}'}</code>, <code>{'{{baseName}}'}</code>, <code>{'{{pageCount}}'}</code>.
          </p>
          <textarea
            className="template-editor-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            readOnly={!template?.editable}
            aria-label="Template source"
          />
          {error && (
            <p className="template-editor-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={reset} disabled={busy || !template?.customized}>
            Reset to bundled
          </button>
          <button className="btn-secondary" onClick={close} disabled={busy}>
            Close
          </button>
          <button className="btn-primary" onClick={save} disabled={busy || !modified || !template?.editable}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
