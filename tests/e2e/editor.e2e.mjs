// End-to-end test of the Electron app (built renderer in dist/).
// Run with `npm run test:e2e` (on Linux without a display: xvfb-run -a npm run test:e2e).

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright-core';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let app;
let page;
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
      args: [ROOT, ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
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
    assert.match(text, /lv_obj_create\(parent\)|lv_obj_create\(/);
    await page.click('.modal-close');
  });

  it('logs no errors or warnings', () => {
    assert.deepEqual(problems, []);
  });
});
