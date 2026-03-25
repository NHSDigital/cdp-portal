import { render, screen } from '@testing-library/react';

import LockedPage, {
  metadata,
} from '@/app/agreement/[agreement_id]/locked/page';

describe('LockedPage tests', () => {
  it('renders ChangeUserRoleForm with correct props', async () => {
    render(await LockedPage());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'We are still aborting your previous request to launch the virtual desktop',
    );
    expect(
      screen.getByText(
        'This can happen when the virtual desktop is launched in quick succession.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Please go back to the home page and try again.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Go back to home')).toHaveAttribute('href', '/');
  });
  it('returns the correct metadata', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Aborting Virtual Desktop');

    expect(typeof metadata.title).toBe('string');
  });
});
