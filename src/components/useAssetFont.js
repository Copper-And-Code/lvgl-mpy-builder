import { useEffect, useReducer } from 'react';
import useStore from '../core/store';

// Fonts of the Asset Manager registered in the document, shared by every
// widget using the same font
const cache = new Map(); // data URL -> { family, loaded, listeners }

function entryFor(dataUrl) {
  let entry = cache.get(dataUrl);
  if (!entry) {
    entry = { family: `lvgl-asset-font-${cache.size + 1}`, loaded: false, listeners: new Set() };
    cache.set(dataUrl, entry);
    new FontFace(entry.family, `url("${dataUrl}")`)
      .load()
      .then((face) => {
        document.fonts.add(face);
        entry.loaded = true;
        entry.listeners.forEach((listener) => listener());
        entry.listeners.clear();
      })
      .catch(() => {
        // Not a font the browser can show: the preview keeps the default font
      });
  }
  return entry;
}

/** CSS font family of the Asset Manager font named `name`, once loaded, or null. */
export default function useAssetFont(name) {
  const dataUrl = useStore((state) => (name ? state.assets.fonts.find((asset) => asset.name === name)?.data : null));
  const entry = typeof dataUrl === 'string' && dataUrl.startsWith('data:') ? entryFor(dataUrl) : null;
  const [, rerender] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    if (!entry || entry.loaded) return undefined;
    entry.listeners.add(rerender);
    return () => entry.listeners.delete(rerender);
  }, [entry]);

  return entry?.loaded ? entry.family : null;
}
