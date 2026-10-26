// End-to-end test of the Electron app (built renderer in dist/).
// Run with `npm run test:e2e` (on Linux without a display: xvfb-run -a npm run test:e2e).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright-core';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let app;
let page;
// Customized templates are saved in the user data folder: use a temporary one
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvgl-editor-e2e-'));
const problems = [];

const hierarchy = () =>
  page.$$eval('.hierarchy-widget', (rows) =>
    rows.map((row) => ({
      name: row.querySelector('.widget-name').textContent,
      level: Math.round((parseInt(row.style.paddingLeft, 10) - 8) / 20),
    }))
  );
const selectedType = () =>
  page.$eval('.properties-panel', (panel) => panel.querySelector('.widget-info input[disabled]')?.value ?? 'none');
const property = (label) =>
  page.locator('.properties-list .property-field', { has: page.locator(`label:text-is("${label}")`) }).first().locator('input');
const canvas = async () => (await page.$('.konvajs-content')).boundingBox();
const dialog = () => page.locator('.dialog-host-box');

describe('LVGL editor (Electron)', () => {
  before(async () => {
    app = await electron.launch({
      executablePath: require('electron'),
      args: [ROOT, `--user-data-dir=${userDataDir}`, ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
    });
    page = await app.firstWindow();
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) problems.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    await page.waitForSelector('.hierarchy-panel');
  });

  after(async () => {
    await app?.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  it('nests a widget and keeps it inside its parent on the canvas', async () => {
    await page.click('.palette-item:has-text("Panel"), button:has-text("Panel")');
    await page.click('.palette-item:has-text("Label"), button:has-text("Label")');
    const rows = page.locator('.hierarchy-widget');
    await rows.nth(1).dragTo(rows.nth(0));
    assert.deepEqual((await hierarchy()).map((row) => row.level), [0, 1]);

    await rows.nth(1).click();
    await property('X Position').fill('20');
    await property('Y Position').fill('20');

    // Panel at (100, 100) with a 2 px border: the label is drawn at (122, 122)
    const box = await canvas();
    await page.mouse.click(box.x + 700, box.y + 500);
    assert.equal(await selectedType(), 'none', 'clicking the background deselects');
    await page.mouse.click(box.x + 132, box.y + 132);
    assert.equal(await selectedType(), 'Label', 'clicking a child selects the child');
  });

  it('undoes a rename typed letter by letter in one step', async () => {
    await page.locator('.hierarchy-widget').nth(1).click();
    const name = page.locator('.widget-info input:not([disabled])');
    const original = await name.inputValue();
    await name.fill('');
    await name.pressSequentially('title_label', { delay: 20 });
    assert.equal((await hierarchy())[1].name, 'title_label');

    await page.click('button:has-text("Undo")');
    assert.equal((await hierarchy())[1].name, original);
    await page.click('button:has-text("Redo")');
  });

  it('deletes a parent with its children and restores both with undo', async () => {
    await page.locator('.hierarchy-widget').nth(0).click();
    await page.click('.widget-actions button:has-text("Delete")');
    assert.equal((await hierarchy()).length, 0);
    await page.click('button:has-text("Undo")');
    assert.equal((await hierarchy()).length, 2);
  });

  it('adds a page that can be renamed inline and deletes it after confirmation', async () => {
    const pages = page.locator('.page-item');
    await page.click('button[title="Add new page"]');
    assert.equal(await pages.count(), 2);
    const nameInput = page.locator('.page-item input');
    await nameInput.fill('Settings');
    await nameInput.press('Enter');
    assert.match(await pages.nth(1).textContent(), /Settings/);
    assert.equal((await hierarchy()).length, 0, 'the new page is empty');

    await pages.nth(1).locator('button[title="Delete page"]').click();
    await dialog().locator('button:has-text("Cancel")').click();
    assert.equal(await pages.count(), 2, 'cancel keeps the page');
    await pages.nth(1).locator('button[title="Delete page"]').click();
    await dialog().locator('button:has-text("Delete")').click();
    assert.equal(await pages.count(), 1);
    assert.equal((await hierarchy()).length, 2, 'back on the first page');
  });

  it('generates the code of the project', async () => {
    await page.click('button:has-text("Export Code")');
    await page.locator('.export-controls select').first().selectOption('c');
    const code = page.locator('.code-preview code');
    await code.filter({ hasText: 'lv_label_create' }).waitFor();
    const text = await code.textContent();
    assert.match(text, /title_label/);
    assert.match(text, /lv_obj_create\(/);
  });

  it('customizes, validates and resets the code template', async () => {
    const code = page.locator('.code-preview code');
    await page.click('button:has-text("Edit Template")');
    const editor = page.locator('.template-editor');
    const source = editor.locator('textarea');
    await source.waitFor();
    const original = await source.inputValue();

    // A broken template is rejected with the Handlebars error
    await source.fill(original + '\n{{#if pages}} unclosed');
    await editor.locator('button:has-text("Save")').click();
    await editor.locator('.template-editor-error').waitFor();
    assert.match(await editor.locator('.template-editor-error').textContent(), /Template error/);

    // A valid change is saved and used by the preview
    await source.fill('/* CUSTOM TEMPLATE MARK */\n' + original);
    await editor.locator('button:has-text("Save")').click();
    await editor.locator('.template-editor-badge').waitFor();
    await code.filter({ hasText: 'CUSTOM TEMPLATE MARK' }).waitFor();
    assert.ok(fs.readdirSync(path.join(userDataDir, 'templates')).length > 0, 'saved in the user data folder');

    // Reset restores the bundled template
    await editor.locator('button:has-text("Reset to bundled")').click();
    await dialog().locator('button:has-text("Reset")').click();
    await code.filter({ hasNotText: 'CUSTOM TEMPLATE MARK' }).filter({ hasText: 'lv_label_create' }).waitFor();
    await editor.locator('button:has-text("Close")').click();
    await page.click('.modal-close');
  });

  it('forbids eval in the renderer (Content Security Policy)', async () => {
    // page.evaluate() itself is not subject to the CSP: use a string timer,
    // which the page evaluates
    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('securitypolicyviolation', (e) => resolve(`blocked by ${e.violatedDirective}`), { once: true });
          setTimeout('window.__evalAllowed = true', 0);
          setTimeout(() => resolve(window.__evalAllowed ? 'allowed' : 'not run'), 500);
        })
    );
    assert.equal(result, 'blocked by script-src');
    // The browser logs the blocked attempt: not an application error
    const expected = problems.filter((problem) => /Refused to evaluate|unsafe-eval/.test(problem));
    expected.forEach((problem) => problems.splice(problems.indexOf(problem), 1));
  });

  it('logs no errors or warnings', () => {
    assert.deepEqual(problems, []);
  });
});
