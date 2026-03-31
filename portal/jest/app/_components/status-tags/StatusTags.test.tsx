import { render, screen } from '@testing-library/react';

import {
  StatusTag,
  WhatDoTheseStatusesMean,
} from '@/app/_components/status-tags/StatusTags';

jest.mock('@/app/_components/status-tags/tagInfoMap', () => ({
  tagInfoMap: {
    Activated: {
      element: <span>Visible Tag</span>,
      description: 'Always visible description',
    },
    'Pending Induction': {
      element: <span>Conditional Tag</span>,
      description: 'Conditionally visible description',
      show: ({ whiteLabelKey }: { whiteLabelKey: string }) =>
        whiteLabelKey === 'CDP',
    },
    Deactivated: {
      element: <span>Hidden Tag</span>,
      description: 'Hidden description',
      show: () => false,
    },
    noElement: {
      element: null,
      description: 'No element',
    },
  },
}));

describe('StatusTag', () => {
  it('renders the element for an active status', () => {
    render(<StatusTag status={'Activated'} />);

    expect(screen.getByText('Visible Tag')).toBeInTheDocument();
  });

  it('returns null when the tag has no element', () => {
    //  @ts-expect-error Testing empty element case
    const { container } = render(<StatusTag status={'noElement'} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('WhatDoTheseStatusesMean', () => {
  it('renders rows when show is undefined or returns true', () => {
    render(<WhatDoTheseStatusesMean whiteLabelKey={'CDP'} />);

    expect(screen.getByText('Visible Tag')).toBeInTheDocument();
    expect(screen.getByText('Conditional Tag')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Tag')).not.toBeInTheDocument();
  });

  it('hides rows when show returns false', () => {
    render(<WhatDoTheseStatusesMean whiteLabelKey={'SDE'} />);

    expect(screen.getByText('Visible Tag')).toBeInTheDocument();
    expect(screen.queryByText('Conditional Tag')).not.toBeInTheDocument();
  });

  it('renders table headers and details wrapper', () => {
    render(<WhatDoTheseStatusesMean whiteLabelKey={'CDP'} />);

    expect(
      screen.getByText('What do these statuses mean?'),
    ).toBeInTheDocument();

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
