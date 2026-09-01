const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies the Picovoice Porcupine custom wake-word (.ppn) file(s) from
 * assets/wakeword into android/app/src/main/assets so PorcupineManager.fromKeywordPaths
 * can find them by filename at runtime. Only relevant for EAS/native builds — Expo Go
 * never runs this.
 */
function withPorcupineAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const sourceDir = path.join(config.modRequest.projectRoot, 'assets', 'wakeword');
      const destDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');

      if (!fs.existsSync(sourceDir)) return config;
      fs.mkdirSync(destDir, { recursive: true });

      for (const file of fs.readdirSync(sourceDir)) {
        if (file.endsWith('.ppn') || file.endsWith('.pv')) {
          fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
        }
      }

      return config;
    },
  ]);
}

module.exports = withPorcupineAssets;
