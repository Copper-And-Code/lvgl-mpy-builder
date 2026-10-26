import { useEffect, useReducer } from 'react';
import useStore from '../core/store';

// Decoded <img> elements shared by every widget showing the same image
const cache = new Map(); // data URL -> { image, loaded, listeners }

function entryFor(dataUrl) {
  let entry = cache.get(dataUrl);
  if (!entry) {
    const image = new window.Image();
    entry = { image, loaded: false, listeners: new Set() };
    image.onload = () => {
      entry.loaded = true;
      entry.listeners.forEach((listener) => listener());
      entry.listeners.clear();
    };
    image.src = dataUrl;
    cache.set(dataUrl, entry);
  }
  return entry;
}

/** The loaded image of the Asset Manager image named `name`, or null. */
export default function useAssetImage(name) {
  const dataUrl = useStore((state) => (name ? state.assets.images.find((asset) => asset.name === name)?.data : null));
  const entry = dataUrl ? entryFor(dataUrl) : null;
  const [, rerender] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    if (!entry || entry.loaded) return undefined;
    entry.listeners.add(rerender);
    return () => entry.listeners.delete(rerender);
  }, [entry]);

  return entry?.loaded ? entry.image : null;
}
