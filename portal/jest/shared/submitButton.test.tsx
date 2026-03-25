import { render, screen } from '@testing-library/react';

import SubmitButton from '@/app/shared/submitButton';

jest.mock('react-dom', () => {
  const actualReactDom = jest.requireActual('react-dom');
  return {
    ...actualReactDom,
    useFormStatus: jest.fn(),
  };
});
const OLD_ENV = process.env;

describe('SubmitButton Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it('renders the button with children text', () => {
    (require('react-dom').useFormStatus as jest.Mock).mockReturnValue({
      pending: false,
    });

    render(<SubmitButton>Submit</SubmitButton>);
    const button = screen.getByRole('button', { name: /submit/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Submit');
  });

  it('disables the button when pending is true', () => {
    (require('react-dom').useFormStatus as jest.Mock).mockReturnValue({
      pending: true,
    });

    render(<SubmitButton>Submit</SubmitButton>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('enables the button when pending is false', () => {
    (require('react-dom').useFormStatus as jest.Mock).mockReturnValue({
      pending: false,
    });

    render(<SubmitButton>Submit</SubmitButton>);
    const button = screen.getByRole('button');

    expect(button).not.toBeDisabled();
  });

  it('falls back to safe version if useFormStatus is not available', () => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NODE_ENV: 'development' };

    jest.doMock('react-dom', () => ({ useFormStatus: undefined }));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const SubmitButtonFallback = require('@/app/shared/submitButton').default;

    render(<SubmitButtonFallback>Submit</SubmitButtonFallback>);
    screen.getByRole('button');

    expect(warnSpy).toHaveBeenCalledWith(
      'useFormStatus fallback triggered — expected in tests, but not in production.',
    );

    warnSpy.mockRestore();
  });

  it('logs import-time fallback warning if react-dom is unavailable', () => {
    jest.resetModules();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    jest.doMock('react-dom', () => {
      throw new Error('react-dom unavailable');
    });

    const SubmitButtonFallback = require('@/app/shared/submitButton').default;

    render(<SubmitButtonFallback>Submit</SubmitButtonFallback>);
    screen.getByRole('button');

    expect(warnSpy).toHaveBeenCalledWith(
      'useFormStatus not available, using fallback.',
    );

    warnSpy.mockRestore();
  });
});
