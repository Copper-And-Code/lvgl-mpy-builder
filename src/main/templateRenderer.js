// Renders code templates in the Electron main process. Handlebars compiles
// templates to JavaScript functions (eval), which the renderer's Content
// Security Policy does not allow; Node has no such restriction.

const Handlebars = require('handlebars');

const MAX_CACHE = 32;

const handlebars = Handlebars.create();

/**
 * Same as src/generators/indent.js: every line after the first is prefixed
 * with `spaces` spaces (tests check that both behave the same).
 */
function indentText(text, spaces) {
  const pad = ' '.repeat(Number.isInteger(spaces) ? spaces : 0);
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, i) => (i === 0 || line.trim() === '' ? line.trimEnd() : pad + line))
    .join('\n');
}

handlebars.registerHelper('indent', (text, spaces) => indentText(text, spaces));

const cache = new Map();

function compile(source) {
  let template = cache.get(source);
  if (!template) {
    // The output is source code, not HTML: never HTML-escape values
    template = handlebars.compile(source, { noEscape: true, strict: false });
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(source, template);
  }
  return template;
}

/** Render a template source with the given data. */
function renderTemplate(source, data) {
  if (typeof source !== 'string') throw new Error('Template source must be a string');
  return compile(source)(data);
}

/** Throws an Error with a readable message if the template does not compile. */
function checkTemplate(source) {
  if (typeof source !== 'string') throw new Error('Template source must be a string');
  try {
    handlebars.precompile(source, { noEscape: true });
  } catch (error) {
    throw new Error(`Template error: ${error.message}`, { cause: error });
  }
}

module.exports = { renderTemplate, checkTemplate, indentText };
