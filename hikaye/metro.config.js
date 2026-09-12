const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const genaiWebEntry = path.join(__dirname, 'node_modules/@google/genai/dist/web/index.mjs');

// @google/genai (Gemini SDK) ships an "exports" map whose "./web" subpath
// points through a shim folder Metro can't follow on its own. Redirect it
// straight to the real browser-safe build so bundling doesn't break.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@google/genai/web') {
    return { filePath: genaiWebEntry, type: 'sourceFile' };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
