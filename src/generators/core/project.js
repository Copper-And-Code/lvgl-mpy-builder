// Project-level code model shared by the C and MicroPython generators:
// identifiers, creation order, grouped event handlers and file-scope
// declarations. The language-specific parts are delegated to the emitters.

import { indentText } from '../indent';
import { CEmitter, PythonEmitter, commentText } from './emit';
import { IdentifierAllocator, sanitizeIdentifier } from './identifiers';
import { v } from './values';
import { buildWidgetOps } from './widgets';
import { cByteLines, imageInfo, parseDataUrl } from './images';

// Event codes valid in LVGL 9.3 and 9.6 that make sense on a widget
export const EVENT_CODES = [
  'CLICKED', 'SHORT_CLICKED', 'SINGLE_CLICKED', 'DOUBLE_CLICKED', 'TRIPLE_CLICKED', 'PRESSED',
  'PRESSING', 'PRESS_LOST', 'RELEASED', 'LONG_PRESSED', 'LONG_PRESSED_REPEAT', 'VALUE_CHANGED',
  'FOCUSED', 'DEFOCUSED', 'LEAVE', 'READY', 'CANCEL', 'KEY', 'ROTARY', 'GESTURE', 'INSERT',
  'SCROLL', 'SCROLL_BEGIN', 'SCROLL_END', 'HOVER_OVER', 'HOVER_LEAVE', 'SIZE_CHANGED', 'DELETE',
  'SCREEN_LOAD_START', 'SCREEN_LOADED', 'SCREEN_UNLOAD_START', 'SCREEN_UNLOADED',
];

const DEFAULT_CANVAS = { width: 800, height: 480 };

/**
 * Order widgets so that every parent is created before its children.
 * Widgets whose parent is missing, on another page or part of a cycle are
 * created as children of the page.
 * @returns {{ widget: object, parent: object|null }[]}
 */
export function orderWidgets(widgets) {
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));
  const children = new Map();
  const roots = [];
  widgets.forEach((widget) => {
    const parent = widget.parentId && widget.parentId !== widget.id ? byId.get(widget.parentId) : null;
    if (parent) {
      if (!children.has(parent.id)) children.set(parent.id, []);
      children.get(parent.id).push(widget);
    } else {
      roots.push(widget);
    }
  });

  const ordered = [];
  const visited = new Set();
  const visit = (widget, parent) => {
    if (visited.has(widget.id)) return;
    visited.add(widget.id);
    ordered.push({ widget, parent });
    (children.get(widget.id) ?? []).forEach((child) => visit(child, widget));
  };
  roots.forEach((widget) => visit(widget, null));
  // Widgets in a parent cycle were not reachable from a root
  widgets.forEach((widget) => visit(widget, null));
  return ordered;
}

function projectPages(projectData) {
  if (!Array.isArray(projectData.pages) || projectData.pages.length === 0) {
    throw new Error('The project has no pages');
  }
  return projectData.pages.map((page, index) => ({
    name: page.name || `Page ${index + 1}`,
    widgets: Array.isArray(page.widgets) ? page.widgets : [],
    canvasSize: page.canvasSize ?? DEFAULT_CANVAS,
  }));
}

/** Python accepts `//` C-style comments typed in the event editor as `#` comments. */
function pythonEventCode(code) {
  return String(code).replace(/^(\s*)\/\/\s?/gm, '$1# ');
}

function renderHandlerBody(handler, language) {
  const branches = [...handler.branches.entries()];
  if (language === 'c') {
    return branches
      .map(([eventCode, code], index) => {
        const body = code.trim() ? code : `/* TODO: handle LV_EVENT_${eventCode} */`;
        return `${index ? 'else ' : ''}if (code == LV_EVENT_${eventCode}) {\n    ${indentText(body, 4)}\n}`;
      })
      .join('\n');
  }
  return branches
    .map(([eventCode, code], index) => {
      const body = code.trim() ? pythonEventCode(code) : `# TODO: handle lv.EVENT.${eventCode}`;
      return `${index ? 'elif' : 'if'} code == lv.EVENT.${eventCode}:\n    ${indentText(body, 4)}\n    pass`;
    })
    .join('\n');
}

/**
 * Build everything the templates need for one language.
 * @param {object} projectData - project as saved by the editor
 * @param {'c'|'micropython'} language
 */
export function buildProjectCode(projectData, language) {
  const ids = new IdentifierAllocator();
  const baseName = ids.allocate(projectData.projectName || 'ui', 'ui');
  // Functions defined by the templates
  ids.reserve(`${baseName}_init`, `${baseName}_load_page`, `${baseName}_load_page_anim`, `${baseName}_get_current_page`);

  const pages = projectPages(projectData).map((page) => ({
    ...page,
    functionName: ids.allocate(`${baseName}_create_${page.name}`, 'page'),
  }));

  // Widget identifiers first, so they keep the user's names whenever possible.
  // In C they become globals named ui_<name>, which must be free too.
  const names = new Map();
  pages.forEach((page) => {
    page.nodes = orderWidgets(page.widgets).map(({ widget, parent }) => {
      const name = ids.allocate(widget.name || widget.type, sanitizeIdentifier(widget.type, 'obj'), (n) => [`ui_${n}`]);
      names.set(widget, name);
      return { widget, name, parent };
    });
    page.nodes.forEach((node) => {
      node.parentName = node.parent ? names.get(node.parent) : null;
    });
  });

  const handlers = new Map(); // name -> { name, branches: Map(eventCode -> code) }
  const handlersByRequest = new Map(); // requested name -> handler names
  // Images of the Asset Manager, by name, are embedded in the code; any other
  // source is a file path
  const assets = new Map((projectData.assets?.images ?? []).map((asset) => [asset.name, asset]));
  const embedded = new Map(); // source -> { symbol, name, info, data }
  const filePaths = new Set();
  const unsupported = new Set();
  let opaHelper = null;

  const context = {
    language,
    temp: (base) => ids.allocate(base, 'tmp'),
    image: (source) => {
      if (embedded.has(source)) return v.image(source, embedded.get(source).symbol);
      const asset = assets.get(source);
      if (!asset) {
        filePaths.add(source);
        return v.image(source);
      }
      const data = parseDataUrl(asset.data);
      const info = data && imageInfo(data.bytes);
      if (!info) {
        unsupported.add(source);
        return null; // the call is skipped
      }
      const file = String(source).replace(/\.[^.]*$/, '');
      const symbol = ids.allocate(`img_${file}`, 'img', (n) => [`${n}_data`]);
      embedded.set(source, { symbol, name: source, info, data });
      return v.image(source, symbol);
    },
    callbackFor: (widget, event) => {
      const eventCode = String(event.type ?? '').replace(/^LV_EVENT_/, '');
      if (!EVENT_CODES.includes(eventCode)) return null;
      const code = String(event.code ?? '');
      const requested = sanitizeIdentifier(event.callback || `${names.get(widget)}_event_cb`, 'event_cb');
      const candidates = handlersByRequest.get(requested) ?? [];
      // Reuse a handler with the same name unless it already handles this
      // event with different code (then each widget keeps its own code)
      let handler = candidates
        .map((name) => handlers.get(name))
        .find((h) => !h.branches.has(eventCode) || h.branches.get(eventCode) === code);
      if (!handler) {
        handler = { name: ids.allocate(requested, 'event_cb'), branches: new Map() };
        handlers.set(handler.name, handler);
        handlersByRequest.set(requested, [...candidates, handler.name]);
      }
      handler.branches.set(eventCode, code);
      return { name: handler.name, eventCode };
    },
  };

  // Operations are language-neutral and built once
  pages.forEach((page) => {
    page.nodes.forEach((node) => {
      node.ops = buildWidgetOps(node, context);
    });
  });

  const fonts = new Set();
  const widgetNames = new Set(names.values());
  const emitterContext = {
    isWidget: (name) => widgetNames.has(name),
    fonts,
    images: new Set(),
    opaHelper: () => {
      opaHelper = opaHelper ?? ids.allocate('ui_anim_set_opa', 'anim_cb');
      return opaHelper;
    },
  };
  const emitter = language === 'c' ? new CEmitter(emitterContext) : new PythonEmitter(emitterContext);

  const pagesData = pages.map((page) => ({
    name: commentText(page.name),
    functionName: page.functionName,
    width: page.canvasSize.width,
    height: page.canvasSize.height,
    widgetCount: page.widgets.length,
    widgets: page.nodes.map((node) => `${emitter.emit(node.ops)}\n`),
  }));

  const eventCallbacks = [...handlers.values()].map((handler) => ({
    name: handler.name,
    body: renderHandlerBody(handler, language),
  }));

  const images = { embedded: [...embedded.values()], filePaths: [...filePaths], unsupported: [...unsupported] };
  const declarations = language === 'c'
    ? cDeclarations({ widgetNames: [...widgetNames], fonts, images, opaHelper })
    : pythonDeclarations({ fonts, images });

  // `model` exposes the language-neutral operations (used by the API tests)
  const model = { pages: pages.map((page) => ({ name: page.name, nodes: page.nodes })) };
  return { baseName, pages: pagesData, eventCallbacks, declarations, model };
}

function cDeclarations({ widgetNames, fonts, images, opaHelper }) {
  const parts = [];
  if (fonts.size) {
    const sizes = [...fonts].sort((a, b) => a - b);
    parts.push(`/* Fonts used: enable ${sizes.map((s) => `LV_FONT_MONTSERRAT_${s}`).join(', ')} in lv_conf.h */`);
  }
  parts.push(...imageNotes(images, '/*', ' */'));
  images.embedded.forEach(({ symbol, name, info, data }) => {
    const png = info.format === 'png';
    parts.push(
      `/* Image "${commentText(name)}" (${info.width}x${info.height} ${png ? 'PNG' : 'JPEG'}), decoded at run time: ` +
        `enable ${png ? 'LV_USE_LODEPNG' : 'LV_USE_TJPGD and LV_USE_FS_MEMFS'} in lv_conf.h */\n` +
        `static const uint8_t ${symbol}_data[] = {\n${cByteLines(data.bytes).map((line) => `    ${line}`).join('\n')}\n};\n` +
        `static const lv_image_dsc_t ${symbol} = {\n` +
        `    .header.magic = LV_IMAGE_HEADER_MAGIC,\n` +
        `    .header.cf = ${png ? 'LV_COLOR_FORMAT_RAW_ALPHA' : 'LV_COLOR_FORMAT_RAW'},\n` +
        `    .header.w = ${info.width},\n` +
        `    .header.h = ${info.height},\n` +
        `    .data_size = sizeof(${symbol}_data),\n` +
        `    .data = ${symbol}_data,\n};`
    );
  });
  if (widgetNames.length) {
    parts.push(
      '/* Widget handles (use `extern lv_obj_t * ui_<name>;` to access them from other files) */\n' +
        widgetNames.map((name) => `lv_obj_t * ui_${name};`).join('\n')
    );
  }
  if (opaHelper) {
    parts.push(
      `static void ${opaHelper}(void * obj, int32_t value)\n{\n    lv_obj_set_style_opa((lv_obj_t *)obj, (lv_opa_t)value, LV_PART_MAIN);\n}`
    );
  }
  return parts.join('\n\n');
}

function imageNotes(images, open, close) {
  const notes = [];
  if (images.filePaths.length) {
    notes.push(`${open} Images loaded from files need an LVGL file system driver: ${images.filePaths.map(commentText).join(', ')}${close}`);
  }
  if (images.unsupported.length) {
    notes.push(`${open} Not generated (only PNG and JPEG images are supported): ${images.unsupported.map(commentText).join(', ')}${close}`);
  }
  return notes;
}

function pythonDeclarations({ fonts, images }) {
  const parts = [];
  if (fonts.size) {
    const sizes = [...fonts].sort((a, b) => a - b);
    parts.push(`# Fonts used: ${sizes.map((s) => `lv.font_montserrat_${s}`).join(', ')} (font sizes are mapped to the ones in the default lv_micropython build: 14, 16, 24)`);
  }
  parts.push(...imageNotes(images, '#', ''));
  if (images.embedded.length) parts.push('import binascii');
  images.embedded.forEach(({ symbol, name, info, data }) => {
    const png = info.format === 'png';
    parts.push(
      `# Image "${commentText(name)}" (${info.width}x${info.height} ${png ? 'PNG' : 'JPEG'}), decoded at run time by LVGL\n` +
        `${symbol}_data = binascii.a2b_base64("${data.base64}")\n` +
        `${symbol} = lv.image_dsc_t({"header": {"magic": lv.IMAGE_HEADER_MAGIC, "cf": lv.COLOR_FORMAT.${png ? 'RAW_ALPHA' : 'RAW'}, ` +
        `"w": ${info.width}, "h": ${info.height}}, "data_size": len(${symbol}_data), "data": ${symbol}_data})`
    );
  });
  parts.push('# Created widgets, by name (e.g. objects["ok_button"])\nobjects = {}');
  return parts.join('\n');
}
