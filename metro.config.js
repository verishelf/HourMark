const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("PNG")) {
  config.resolver.assetExts.push("PNG");
}

module.exports = withNativeWind(config, { input: "./global.css" });
