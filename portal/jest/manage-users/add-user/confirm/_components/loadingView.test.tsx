import { render, screen } from '@testing-library/react';

import LoadingView from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/loadingView';
import { Progress } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useSubmitUsers';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/loader.module.css',
  () => ({
    loader_container: 'mock-loader-container',
    loader: 'mock-loader',
  }),
);

describe('LoadingView tests', () => {
  it('renders "Adding user" when overall is 1', () => {
    const progress: Progress = {
      overall: 1,
      completed: 0,
    };

    render(<LoadingView progress={progress} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Adding user',
    );
  });

  it('renders progress correctly when overall > 1', () => {
    const progress: Progress = {
      overall: 3,
      completed: 1,
    };

    render(<LoadingView progress={progress} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Adding user 2 of 3',
    );
  });

  it('caps the progress display at overall value', () => {
    const progress: Progress = {
      overall: 2,
      completed: 5,
    };

    render(<LoadingView progress={progress} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Adding user 2 of 2',
    );
  });

  it('sets document title on render', () => {
    const progress: Progress = {
      overall: 1,
      completed: 0,
    };

    render(<LoadingView progress={progress} />);
    expect(document.title).toBe('Adding user(s)');
  });

  it('renders loader container and loader elements', () => {
    const progress: Progress = {
      overall: 1,
      completed: 0,
    };

    render(<LoadingView progress={progress} />);
    expect(screen.getAllByText(/Adding user/i).length).toBeGreaterThan(0);
    expect(
      document.querySelector('.mock-loader-container'),
    ).toBeInTheDocument();
    expect(document.querySelector('.mock-loader')).toBeInTheDocument();
  });
});
