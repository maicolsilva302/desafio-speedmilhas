const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');

async function setupNodeEvents(on, config) {
  await addCucumberPreprocessorPlugin(on, config);
  on(
    'file:preprocessor',
    createBundler({ plugins: [createEsbuildPlugin(config)] }),
  );
  return config;
}

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.js',
    baseUrl: 'http://localhost:3001',
    defaultCommandTimeout: 15000,
    viewportWidth: 1440,
    viewportHeight: 960,
    video: false,
    env: {
      stepDefinitions: ['cypress/e2e/step_definitions/**/*.js'],
    },
    setupNodeEvents,
  },
});
