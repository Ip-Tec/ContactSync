const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = (() => {
  let config = getDefaultConfig(__dirname);

  // Enable NativeWind support
  config = withNativeWind(config, { input: "./global.css" });

  // Ensure "cjs" files are resolved properly
  config.resolver.assetExts.push("cjs");

  return config;
})();
