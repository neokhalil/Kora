module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Configuration pour gérer les imports CSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Alias pour les imports de client/src
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@components/(.*)$': '<rootDir>/client/src/components/$1',
    '^@styles/(.*)$': '<rootDir>/client/src/styles/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};