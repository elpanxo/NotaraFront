module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx}',
    'src/context/**/*.{js,jsx}',
    'src/patterns/**/*.{js,jsx}',
    'src/components/ui/SongCard.js',
    'src/components/ui/SearchBar.js',
    'src/components/ui/SpotifyEmbedPlayer.js',
    'src/components/lesson/ProgressWidget.js',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transformIgnorePatterns: ['/node_modules/'],
};
