const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Metro on Windows crashes (ENOENT watch) if it crawls Gradle caches under
// node_modules that npm/Gradle delete while the bundler is starting.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  /[\\/]\.gradle[\\/].*/,
  /[\\/]expo-module-gradle-plugin[\\/].*/,
  /[\\/]android[\\/](?:build|\.gradle|bin)[\\/].*/,
  // npm rename leftovers (`.pkg-XXXX`) that Metro otherwise tries to watch
  /[\\/]node_modules[\\/]\.[^\\/]+[\\/].*/,
];

module.exports = withNativeWind(config, { input: './global.css' });

