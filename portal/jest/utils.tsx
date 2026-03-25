import { screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Logger } from 'pino';

// @ts-ignore
expect.extend(toHaveNoViolations);

export const getByDataCy = (cy: string) => {
  return screen.getByText((_content, el) => el?.getAttribute('data-cy') === cy);
};

export const queryByDataCy = (cy: string) => {
  return screen.queryByText(
    (_content, el) => el?.getAttribute('data-cy') === cy,
  );
};

export const queryAllByDataCy = (cy: string) => {
  return screen.queryAllByText(
    (_content, el) => el?.getAttribute('data-cy') === cy,
  );
};

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  level: 'info',
} as unknown as Logger;

export async function checkAccessibility(container: HTMLElement) {
  const results = await axe(container);
  // @ts-expect-error TS2339
  expect(results).toHaveNoViolations();
}
