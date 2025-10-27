import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage/jest',
  coverageReporters: ['json', 'lcov', 'text'],
};

const jestConfigPromise = createJestConfig(customJestConfig);

const getJestConfig = async () => {
  const config = await jestConfigPromise();

  config.transformIgnorePatterns = [
    '^.+\\.module\\.(css|sass|scss)$',
    '/node_modules/(?!(jose|openid-client|@panva/hkdf|uuid|preact-render-to-string|next-auth|preact)/)',
  ];

  return config;
};

export default getJestConfig;
