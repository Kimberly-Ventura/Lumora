const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for local 3D models (GLB and GLTF extensions) in Metro Packager
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
