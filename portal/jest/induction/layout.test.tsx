import { render, screen } from '@testing-library/react';
import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { notFound } from 'next/navigation';

import InductionLayout from '@/app/induction/layout';

jest.mock('app/services/hasFeatureFlagEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

describe('InductionLayout', () => {
  const mockHasFeatureFlagEnabled = hasFeatureFlagEnabled as jest.Mock;

  it('renders children if feature flag is enabled', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValueOnce(true);

    const result = await InductionLayout({
      children: <div data-testid='test-child'>Induction Content</div>,
    });

    render(result);

    expect(screen.getByTestId('test-child')).toHaveTextContent(
      'Induction Content',
    );
    expect(notFound).not.toHaveBeenCalled();
  });

  it('calls notFound if feature flag is disabled', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValueOnce(false);

    await InductionLayout({
      children: <div>Should not render</div>,
    });

    expect(notFound).toHaveBeenCalled();
  });
});
