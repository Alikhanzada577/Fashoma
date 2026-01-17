const path = require('path');

module.exports = function (api) {
  api.cache(false); // Disable cache to ensure changes are picked up
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // More specific aliases first - these must come before the general '@' alias
            '@/components': path.resolve(__dirname, 'src/components'),
            '@/constants': path.resolve(__dirname, 'src/constants'),
            '@/hooks': path.resolve(__dirname, 'src/hooks'),
            '@/assets': path.resolve(__dirname, 'src/assets'),
            // General alias last - only for imports that don't match above
            '@': path.resolve(__dirname, '.'),
          },
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.android.js',
            '.android.tsx',
            '.ios.js',
            '.ios.tsx',
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
