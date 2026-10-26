import { useState } from 'react';
import { closeDialog, dismissToast, useDialogStore } from '../core/dialogs';
import '../styles/DialogHost.css';

function Dialog({ dialog }) {
  const [value, setValue] = useState(dialog.defaultValue ?? '');
  const cancel = () => closeDialog(dialog.id, dialog.kind === 'prompt' ? null : false);
  const accept = () => closeDialog(dialog.id, dialog.kind === 'prompt' ? value : true);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter' && dialog.kind !== 'prompt') accept();
  };

  return (
    <div className="dialog-host-overlay" onKeyDown={onKeyDown}>
      <div className="dialog-host-box" role="dialog" aria-modal="true" aria-labelledby={`dialog-${dialog.id}-title`}>
        <h3 id={`dialog-${dialog.id}-title`}>{dialog.title}</h3>
        <p className="dialog-host-message">{dialog.message}</p>
        {dialog.kind === 'prompt' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              accept();
            }}
          >
            <input
              autoFocus
              value={value}
              placeholder={dialog.placeholder}
              onChange={(e) => setValue(e.target.value)}
              aria-label={dialog.message}
            />
          </form>
        )}
        <div className="dialog-host-actions">
          {dialog.kind !== 'alert' && (
            <button type="button" onClick={cancel}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className={dialog.danger ? 'dialog-host-danger' : 'dialog-host-primary'}
            onClick={accept}
            autoFocus={dialog.kind !== 'prompt'}
          >
            {dialog.kind === 'confirm' ? dialog.confirmLabel : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Renders the dialogs and notifications requested through core/dialogs. */
export default function DialogHost() {
  const dialog = useDialogStore((state) => state.queue[0]);
  const toasts = useDialogStore((state) => state.toasts);

  return (
    <>
      {dialog && <Dialog key={dialog.id} dialog={dialog} />}
      <div className="dialog-host-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`dialog-host-toast dialog-host-toast-${toast.kind}`} role="status">
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
