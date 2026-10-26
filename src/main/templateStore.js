// Code-generation template storage for the Electron main process.
//
// Only whitelisted architecture/template names are accepted and every path is
// checked to stay inside its templates directory, so the renderer cannot read
// or write arbitrary files. User edits are saved under userData (writable even
// when the app is packaged in a read-only asar); bundled templates are the
// read-only fallback.

const path = require('path');
const fs = require('fs');

const ARCHITECTURES = ['unix', 'stm32', 'esp32', 'rp2040', 'nrf52'];
const TEMPLATE_NAMES = ['c', 'micropython'];
const MAX_TEMPLATE_SIZE = 1024 * 1024; // 1 MiB

function resolveTemplatePath(baseDir, architecture, templateName) {
  if (!ARCHITECTURES.includes(architecture)) {
    throw new Error(`Invalid architecture: ${architecture}`);
  }
  if (!TEMPLATE_NAMES.includes(templateName)) {
    throw new Error(`Invalid template name: ${templateName}`);
  }

  const root = path.resolve(baseDir, 'templates');
  const fullPath = path.resolve(root, architecture, `${templateName}_template.hbs`);
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error('Template path escapes the templates directory');
  }
  return fullPath;
}

/**
 * Read a template, preferring the user's customized copy.
 * @returns {string|null} template source, or null if none exists
 */
function readTemplate({ userDir, bundledDir }, architecture, templateName) {
  for (const baseDir of [userDir, bundledDir]) {
    if (!baseDir) continue;
    const filePath = resolveTemplatePath(baseDir, architecture, templateName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  }
  return null;
}

/**
 * Save a customized template under the user's data directory.
 */
function writeTemplate(userDir, architecture, templateName, content) {
  if (typeof content !== 'string') {
    throw new Error('Template content must be a string');
  }
  if (Buffer.byteLength(content, 'utf-8') > MAX_TEMPLATE_SIZE) {
    throw new Error('Template is too large');
  }

  const filePath = resolveTemplatePath(userDir, architecture, templateName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

module.exports = {
  ARCHITECTURES,
  TEMPLATE_NAMES,
  resolveTemplatePath,
  readTemplate,
  writeTemplate,
};
