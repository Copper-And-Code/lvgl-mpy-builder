// Non-blocking replacements for window.alert/confirm/prompt (prompt() does
// not work in Electron) plus short notifications. They can be called from
// anywhere; <DialogHost /> renders them.

import { create } from 'zustand';

let nextId = 1;

export const useDialogStore = create(() => ({
  queue: [], // modal dialogs, the first one is shown
  toasts: [],
}));

function openDialog(dialog) {
  return new Promise((resolve) => {
    const entry = { id: nextId++, ...dialog, resolve };
    useDialogStore.setState((state) => ({ queue: [...state.queue, entry] }));
  });
}

/** Close the dialog with the given id and resolve its promise. */
export function closeDialog(id, result) {
  const { queue } = useDialogStore.getState();
  const entry = queue.find((dialog) => dialog.id === id);
  if (!entry) return;
  useDialogStore.setState({ queue: queue.filter((dialog) => dialog.id !== id) });
  entry.resolve(result);
}

/** Message with an OK button. */
export function showAlert(message, { title = 'LVGL Editor' } = {}) {
  return openDialog({ kind: 'alert', title, message }).then(() => undefined);
}

/** Resolves to true when confirmed. */
export function showConfirm(message, { title = 'Please confirm', confirmLabel = 'OK', danger = false } = {}) {
  return openDialog({ kind: 'confirm', title, message, confirmLabel, danger }).then(Boolean);
}

/** Resolves to the entered text, or null when cancelled. */
export function showPrompt(message, { title = 'LVGL Editor', defaultValue = '', placeholder = '' } = {}) {
  return openDialog({ kind: 'prompt', title, message, defaultValue, placeholder });
}

/** Short message that disappears by itself. kind: info | success | error */
export function notify(message, { kind = 'info', timeout = 4000 } = {}) {
  const id = nextId++;
  useDialogStore.setState((state) => ({ toasts: [...state.toasts, { id, message, kind }] }));
  if (timeout > 0) setTimeout(() => dismissToast(id), timeout);
  return id;
}

export function dismissToast(id) {
  useDialogStore.setState((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
}

/** Message listing validation warnings (loading a project or a library). */
export function warningsMessage(intro, warnings, max = 10) {
  const shown = warnings.slice(0, max).map((warning) => `• ${warning}`);
  if (warnings.length > max) shown.push(`• … and ${warnings.length - max} more`);
  return `${intro}\n\n${shown.join('\n')}`;
}
