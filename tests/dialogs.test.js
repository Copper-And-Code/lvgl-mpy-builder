import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDialog, notify, showAlert, showConfirm, showPrompt, useDialogStore, warningsMessage } from '../src/core/dialogs';

const queue = () => useDialogStore.getState().queue;

beforeEach(() => {
  vi.useFakeTimers();
  useDialogStore.setState({ queue: [], toasts: [] });
});
afterEach(() => vi.useRealTimers());

describe('dialogs', () => {
  it('resolves confirm with the user choice and shows dialogs one at a time', async () => {
    const first = showConfirm('Delete?');
    const second = showPrompt('Name?', { defaultValue: 'x' });
    expect(queue().map((d) => d.kind)).toEqual(['confirm', 'prompt']);

    closeDialog(queue()[0].id, true);
    await expect(first).resolves.toBe(true);
    expect(queue().map((d) => d.kind)).toEqual(['prompt']);

    closeDialog(queue()[0].id, null);
    await expect(second).resolves.toBeNull();
  });

  it('resolves alert when closed', async () => {
    const done = showAlert('Hello');
    closeDialog(queue()[0].id, true);
    await expect(done).resolves.toBeUndefined();
  });

  it('removes notifications after their timeout', () => {
    notify('Saved', { kind: 'success', timeout: 1000 });
    expect(useDialogStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(useDialogStore.getState().toasts).toHaveLength(0);
  });

  it('lists warnings, truncating long lists', () => {
    const message = warningsMessage('Loaded:', ['a', 'b', 'c'], 2);
    expect(message).toBe('Loaded:\n\n• a\n• b\n• … and 1 more');
  });
});
