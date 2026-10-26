import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTAL_FEATURES, isFeatureEnabled, reloadFeatures, setFeatureEnabled, useFeatures } from '../src/core/features';

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
}

describe('experimental features', () => {
  let storage;
  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    reloadFeatures();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('are all disabled by default', () => {
    expect(EXPERIMENTAL_FEATURES.map((f) => f.id)).toEqual(['cloudSync', 'collaboration', 'plugins']);
    expect(Object.values(useFeatures.getState().enabled)).toEqual([false, false, false]);
  });

  it('are saved on this computer and reloaded', () => {
    setFeatureEnabled('cloudSync', true);
    expect(isFeatureEnabled('cloudSync')).toBe(true);
    expect(JSON.parse(storage.data.get('lvgl-editor.experimental-features'))).toMatchObject({ cloudSync: true });

    vi.stubGlobal('localStorage', fakeStorage(Object.fromEntries(storage.data)));
    reloadFeatures();
    expect(isFeatureEnabled('cloudSync')).toBe(true);
    expect(isFeatureEnabled('plugins')).toBe(false);
  });

  it('ignores invalid saved values and unknown features', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'lvgl-editor.experimental-features': '{"plugins":"yes","other":true' }));
    reloadFeatures();
    expect(isFeatureEnabled('plugins')).toBe(false);
    expect(() => setFeatureEnabled('other', true)).toThrow();
  });

  it('works without storage', () => {
    vi.stubGlobal('localStorage', undefined);
    reloadFeatures();
    setFeatureEnabled('collaboration', true);
    expect(isFeatureEnabled('collaboration')).toBe(true);
  });
});
