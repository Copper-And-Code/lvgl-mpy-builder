// Experimental features: incomplete, disabled by default and enabled by the
// user in Settings. The choice is an editor setting (stored on this computer),
// not part of the project.

import { create } from 'zustand';

const STORAGE_KEY = 'lvgl-editor.experimental-features';

export const EXPERIMENTAL_FEATURES = [
  {
    id: 'cloudSync',
    name: 'Cloud sync',
    limitations: 'Only one provider: projects are stored in this app’s local storage, on this computer. No online service is available yet.',
  },
  {
    id: 'collaboration',
    name: 'Collaborative editing',
    limitations: 'Simulated: there is no collaboration server and no changes are exchanged with other users.',
  },
  {
    id: 'plugins',
    name: 'Plugins',
    limitations: 'Loading external plugins is disabled until plugins run in a sandbox; there are no built-in plugins yet.',
  },
];

const DEFAULTS = Object.fromEntries(EXPERIMENTAL_FEATURES.map((feature) => [feature.id, false]));

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage disabled
  }
}

function load() {
  try {
    const saved = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? '{}');
    return Object.fromEntries(Object.keys(DEFAULTS).map((id) => [id, saved?.[id] === true]));
  } catch {
    return { ...DEFAULTS };
  }
}

export const useFeatures = create(() => ({ enabled: load() }));

export function isFeatureEnabled(id) {
  return useFeatures.getState().enabled[id] === true;
}

export function setFeatureEnabled(id, value) {
  if (!(id in DEFAULTS)) throw new Error(`Unknown experimental feature: ${id}`);
  const enabled = { ...useFeatures.getState().enabled, [id]: Boolean(value) };
  useFeatures.setState({ enabled });
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(enabled));
  } catch {
    // not persisted: the setting lasts until the app is closed
  }
}

/** Reload the settings from storage (used by tests). */
export function reloadFeatures() {
  useFeatures.setState({ enabled: load() });
}
