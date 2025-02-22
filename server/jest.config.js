module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
};
