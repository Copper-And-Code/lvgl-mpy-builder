/**
 * Re-indent multi-line text: every line after the first is prefixed with
 * `spaces` spaces, so user code placed inside a block keeps a valid
 * indentation (required by Python, cosmetic in C).
 */
export function indentText(text, spaces) {
  const pad = ' '.repeat(Number.isInteger(spaces) ? spaces : 0);
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, i) => (i === 0 || line.trim() === '' ? line.trimEnd() : pad + line))
    .join('\n');
}
