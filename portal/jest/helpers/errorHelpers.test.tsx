import { act, render, screen } from '@testing-library/react';
import { Component, PropsWithChildren } from 'react';

import { useAsyncError } from '@/helpers/errorHelpers';

class ErrorBoundary extends Component<
  PropsWithChildren<{ onError: (e: Error) => void }>
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.hasError ? (
      <div>Boundary Error</div>
    ) : (
      this.props.children
    );
  }
}

const TestComponent = ({
  onExpose,
}: {
  onExpose: (fn: (e: unknown) => void) => void;
}) => {
  const throwAsync = useAsyncError();
  onExpose(throwAsync);
  return <div>Ready</div>;
};

describe('useAsyncError', () => {
  it('throws an error that is captured by an error boundary', () => {
    const handleError = jest.fn();
    let triggerError!: (e: unknown) => void;

    render(
      <ErrorBoundary onError={handleError}>
        <TestComponent onExpose={(fn) => (triggerError = fn)} />
      </ErrorBoundary>,
    );

    act(() => {
      triggerError(new Error('Test error'));
    });

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0][0].message).toBe('Test error');

    expect(screen.getByText('Boundary Error')).toBeInTheDocument();
  });
});
