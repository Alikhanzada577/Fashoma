// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add path aliases for src folder
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(__dirname, '.'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/constants': path.resolve(__dirname, 'src/constants'),
    '@/hooks': path.resolve(__dirname, 'src/hooks'),
    '@/assets': path.resolve(__dirname, 'src/assets'),
  },
};

// Add src to watchFolders
config.watchFolders = [path.resolve(__dirname, 'src')];

module.exports = config;
