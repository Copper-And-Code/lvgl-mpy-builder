// Pure helpers on the widgets of a page: hierarchy, LVGL-like coordinates,
// id remapping and unique names. The store and the canvas use them; they do
// not depend on React or on the store.

import { v4 as uuidv4 } from 'uuid';
import { previewProps } from './previewProps';

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

export function findWidget(widgets, id) {
  return widgets.find((widget) => widget.id === id) ?? null;
}

/** Map parent id -> children, in array (z) order; roots are under `null`. */
export function childrenByParent(widgets) {
  const ids = new Set(widgets.map((widget) => widget.id));
  const map = new Map([[null, []]]);
  widgets.forEach((widget) => {
    const parent = widget.parentId && ids.has(widget.parentId) ? widget.parentId : null;
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(widget);
  });
  return map;
}

/** Ids of all descendants of `id` (not including `id`). */
export function descendantIds(widgets, id) {
  const children = childrenByParent(widgets);
  const result = new Set();
  const visit = (parentId) => {
    (children.get(parentId) ?? []).forEach((child) => {
      if (result.has(child.id)) return;
      result.add(child.id);
      visit(child.id);
    });
  };
  visit(id);
  return result;
}

/** The widget and its descendants, in array order. */
export function subtree(widgets, id) {
  const ids = descendantIds(widgets, id);
  ids.add(id);
  return widgets.filter((widget) => ids.has(widget.id));
}

/**
 * Offset of a parent's content area from its top-left corner. LVGL places
 * children inside the content area: inside the border and the padding.
 */
export function contentOffset(widget) {
  if (!widget) return { x: 0, y: 0 };
  const props = previewProps(widget);
  const border = num(props.borderWidth);
  return { x: border + num(props.padLeft), y: border + num(props.padTop) };
}

/** Top-left corner of a widget in canvas coordinates. */
export function absolutePosition(widgets, id) {
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));
  let widget = byId.get(id);
  let x = 0;
  let y = 0;
  const seen = new Set();
  while (widget && !seen.has(widget.id)) {
    seen.add(widget.id);
    x += num(widget.props?.x);
    y += num(widget.props?.y);
    const parent = widget.parentId ? byId.get(widget.parentId) : null;
    if (parent) {
      const offset = contentOffset(parent);
      x += offset.x;
      y += offset.y;
    }
    widget = parent;
  }
  return { x, y };
}

/** Canvas coordinates of the origin of a parent's content area (or the screen). */
export function contentOrigin(widgets, parentId) {
  const parent = parentId ? findWidget(widgets, parentId) : null;
  if (!parent) return { x: 0, y: 0 };
  const position = absolutePosition(widgets, parent.id);
  const offset = contentOffset(parent);
  return { x: position.x + offset.x, y: position.y + offset.y };
}

/** A name not used by any of `widgets` (name, name_2, name_3, ...). */
export function uniqueName(base, widgets) {
  const used = new Set(widgets.map((widget) => widget.name));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

/**
 * Copy widgets with new ids. parentIds pointing inside the copied set are
 * remapped; the others become null (the copies become roots).
 */
export function cloneWithNewIds(widgets) {
  const ids = new Map(widgets.map((widget) => [widget.id, uuidv4()]));
  const prefix = (id) => `${id}_${uuidv4().slice(0, 8)}`;
  return widgets.map((widget) => ({
    ...widget,
    id: ids.get(widget.id),
    parentId: widget.parentId && ids.has(widget.parentId) ? ids.get(widget.parentId) : null,
    props: { ...widget.props },
    events: (widget.events ?? []).map((event) => ({ ...event, id: prefix(event.id ?? 'evt') })),
    animations: (widget.animations ?? []).map((animation) => ({ ...animation, id: prefix(animation.id ?? 'anim') })),
    customStyles: { ...(widget.customStyles ?? {}) },
  }));
}

/** Give each widget a name that is unique within `existing` and the batch. */
export function withUniqueNames(widgets, existing, suffix = '') {
  const taken = [...existing];
  return widgets.map((widget) => {
    const name = uniqueName(`${widget.name || widget.type}${suffix}`, taken);
    const renamed = { ...widget, name };
    taken.push(renamed);
    return renamed;
  });
}

/** Whether `parentId` can become the parent of `id` (no self or cycle). */
export function canReparent(widgets, id, parentId) {
  if (!parentId) return true;
  if (parentId === id || !findWidget(widgets, parentId)) return false;
  return !descendantIds(widgets, id).has(parentId);
}
