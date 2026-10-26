// Electron Forge configuration: `npm run package` / `npm run make`
const { execSync } = require('node:child_process');

// The renderer is bundled by Vite into dist/; the main process only needs
// these runtime modules (Handlebars renders the code templates)
const MAIN_PROCESS_MODULES = ['handlebars', 'minimist', 'neo-async', 'source-map', 'wordwrap', 'lv_font_conv'];

const INCLUDED = [
  /^\/package\.json$/,
  /^\/dist(\/|$)/,
  /^\/src(\/main(\/|$)|$)/,
  /^\/templates(\/|$)/,
  /^\/node_modules$/,
  new RegExp(`^/node_modules/(${MAIN_PROCESS_MODULES.join('|')})(/|$)`),
];

module.exports = {
  packagerConfig: {
    asar: true,
    prune: false, // the ignore list below already selects the runtime files
    ignore: (file) => file !== '' && !INCLUDED.some((pattern) => pattern.test(file)),
  },
  makers: [{ name: '@electron-forge/maker-zip' }],
  hooks: {
    // Build the renderer before packaging
    generateAssets: async () => {
      execSync('npx vite build', { stdio: 'inherit' });
    },
  },
};
