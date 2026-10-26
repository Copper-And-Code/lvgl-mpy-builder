// Validation of project files and component libraries. There is a single
// supported format (no migrations): invalid parts are dropped or repaired
// and reported as warnings, so that a bad file can never crash the UI.

import { v4 as uuidv4 } from 'uuid';
import { widgetDefinitions } from './widgetDefinitions';
import { uniqueName } from './projectModel';

export const DEFAULT_CANVAS_SIZE = { width: 1024, height: 600 };

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPositiveInt = (value) => Number.isInteger(value) && value > 0 && value <= 10000;

/**
 * Validate the widgets of one page (or of a component).
 * @param {unknown[]} widgets
 * @param {Set<string>} usedIds - ids already taken in the project (updated)
 * @param {string[]} warnings - collects human readable messages
 * @param {string} where - context for the messages
 */
export function validateWidgets(widgets, usedIds, warnings, where) {
  if (!Array.isArray(widgets)) {
    if (widgets !== undefined) warnings.push(`${where}: widgets is not a list and was ignored`);
    return [];
  }

  const valid = [];
  const idMap = new Map(); // original id -> id kept in the project
  widgets.forEach((raw, index) => {
    if (!isObject(raw)) {
      warnings.push(`${where}: item ${index + 1} is not a widget and was removed`);
      return;
    }
    const definition = widgetDefinitions[raw.type];
    if (!definition) {
      warnings.push(`${where}: widget "${raw.name ?? raw.id ?? index + 1}" has the unknown type "${raw.type}" and was removed`);
      return;
    }
    let id = typeof raw.id === 'string' && raw.id ? raw.id : null;
    if (!id || usedIds.has(id)) {
      const replacement = uuidv4();
      if (id) warnings.push(`${where}: duplicate widget id "${id}" was replaced`);
      id = replacement;
    }
    usedIds.add(id);
    if (typeof raw.id === 'string') idMap.set(raw.id, id);

    valid.push({
      id,
      type: raw.type,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : definition.name,
      parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
      props: { ...definition.defaultProps, ...(isObject(raw.props) ? raw.props : {}) },
      events: Array.isArray(raw.events) ? raw.events.filter(isObject) : [],
      animations: Array.isArray(raw.animations) ? raw.animations.filter(isObject) : [],
      customStyles: isObject(raw.customStyles) ? raw.customStyles : {},
    });
  });

  // Names must be unique on a page: they become the identifiers of the code
  const named = [];
  valid.forEach((widget) => {
    const name = uniqueName(widget.name, named);
    if (name !== widget.name) warnings.push(`${where}: duplicate widget name "${widget.name}" was renamed to "${name}"`);
    named.push({ ...widget, name });
  });

  // Parents must exist on the same page and must not form a cycle
  const byId = new Map(named.map((widget) => [widget.id, widget]));
  named.forEach((widget) => {
    if (!widget.parentId) return;
    widget.parentId = idMap.get(widget.parentId) ?? widget.parentId;
    if (!byId.has(widget.parentId) || widget.parentId === widget.id) {
      warnings.push(`${where}: widget "${widget.name}" had a missing parent and was moved to the screen`);
      widget.parentId = null;
    }
  });
  named.forEach((widget) => {
    const seen = new Set([widget.id]);
    let parent = widget.parentId ? byId.get(widget.parentId) : null;
    while (parent) {
      if (seen.has(parent.id)) {
        warnings.push(`${where}: widget "${widget.name}" was part of a parent cycle and was moved to the screen`);
        widget.parentId = null;
        return;
      }
      seen.add(parent.id);
      parent = parent.parentId ? byId.get(parent.parentId) : null;
    }
  });
  return named;
}

/**
 * Validate a project file.
 * @returns {{ project: object, warnings: string[] }}
 * @throws {Error} if the file is not a project
 */
export function validateProject(data) {
  if (!isObject(data) || !Array.isArray(data.pages) || data.pages.length === 0) {
    throw new Error('Unsupported project file: no pages found');
  }

  const warnings = [];
  const pageIds = new Set();
  const widgetIds = new Set();
  const pages = data.pages.filter(isObject).map((raw, index) => {
    let id = typeof raw.id === 'string' && raw.id ? raw.id : null;
    if (!id || pageIds.has(id)) id = `page_${uuidv4()}`;
    pageIds.add(id);
    const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : `Page ${index + 1}`;
    const size = isObject(raw.canvasSize) ? raw.canvasSize : {};
    const canvasSize = isPositiveInt(size.width) && isPositiveInt(size.height)
      ? { width: size.width, height: size.height }
      : { ...DEFAULT_CANVAS_SIZE };
    if (canvasSize.width !== size.width || canvasSize.height !== size.height) {
      warnings.push(`Page "${name}": invalid display size, set to ${canvasSize.width}x${canvasSize.height}`);
    }
    return { id, name, canvasSize, widgets: validateWidgets(raw.widgets, widgetIds, warnings, `Page "${name}"`) };
  });
  if (pages.length === 0) throw new Error('Unsupported project file: no valid pages found');

  const currentPageId = pages.some((page) => page.id === data.currentPageId) ? data.currentPageId : pages[0].id;
  const assets = isObject(data.assets) ? data.assets : {};

  return {
    project: {
      projectName: typeof data.projectName === 'string' && data.projectName.trim() ? data.projectName : 'Untitled Project',
      targetArchitecture: typeof data.targetArchitecture === 'string' ? data.targetArchitecture : undefined,
      pages,
      currentPageId,
      assets: {
        images: Array.isArray(assets.images) ? assets.images.filter(isObject) : [],
        fonts: Array.isArray(assets.fonts) ? assets.fonts.filter(isObject) : [],
      },
      componentLibrary: validateComponents(data.componentLibrary, warnings),
    },
    warnings,
  };
}

/** Validate the saved components of a library (project or imported file). */
export function validateComponents(components, warnings = []) {
  if (!Array.isArray(components)) return [];
  return components.filter(isObject).map((raw, index) => {
    const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : `Component ${index + 1}`;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uuidv4(),
      name,
      description: typeof raw.description === 'string' ? raw.description : '',
      tags: Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : [],
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      widgets: validateWidgets(raw.widgets, new Set(), warnings, `Component "${name}"`),
    };
  });
}
