import { fireEvent, render, screen } from '@testing-library/react';

import { ServiceCard } from '@/app/agreement/[agreement_id]/_components/ServiceCard';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('ServiceCard', () => {
  const defaultProps = {
    title: 'Test Service',
    description: 'Test description',
    href: '/test-url',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<ServiceCard {...defaultProps} />);

    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('navigates using router.push when new_window is false or undefined', () => {
    render(<ServiceCard {...defaultProps} />);

    const link = screen.getByRole('link', { name: 'Test Service' });

    fireEvent.click(link);

    expect(pushMock).toHaveBeenCalledWith('/test-url');
  });

  it('opens a new window when new_window is true', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<ServiceCard {...defaultProps} new_window={true} />);

    const link = screen.getByRole('link', { name: 'Test Service' });

    fireEvent.click(link);

    expect(openSpy).toHaveBeenCalledWith('/test-url', '_blank');
    expect(pushMock).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });

  it('uses default width and cypress id when not provided', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const li = container.querySelector('li');

    expect(li).toHaveClass('nhsuk-grid-column-two-thirds');
    expect(li).toHaveAttribute('data-cy', 'service-card');
  });

  it('uses custom width and cypress id when provided', () => {
    const { container } = render(
      <ServiceCard
        {...defaultProps}
        width='custom-width'
        cypress_id='custom-id'
      />,
    );

    const li = container.querySelector('li');

    expect(li).toHaveClass('custom-width');
    expect(li).toHaveAttribute('data-cy', 'custom-id');
  });
});
