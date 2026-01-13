module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for reanimated to work on Android/iOS
      'react-native-reanimated/plugin',
    ],
  };
};