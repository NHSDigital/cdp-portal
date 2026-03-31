import { render } from '@testing-library/react';

import {
  DeactivateUserContent,
  DeactivateUserContentProps,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/DeactivateUserContent';

const props: DeactivateUserContentProps = {
  usersFullName: 'Humpty Dumpty',
  whiteLabelKey: 'SDE',
};

describe('DeactivateUserContent', () => {
  test('renders correctly for SDE', () => {
    const { container } = render(<DeactivateUserContent {...props} />);
    expect(container).toHaveTextContent('Deactivate Humpty Dumpty');
    expect(container).toHaveTextContent(
      'Deactivated users will receive an email notification.',
    );
    expect(container).toHaveTextContent(
      'Deactivated users are not charged for. However, if these users have been active at any time during an invoiced calendar month, the user will still be charged for as standard.',
    );
    expect(container).toHaveTextContent(
      'You can reactivate a user that has been deactivated at any time.',
    );
  });

  test('renders correctly for CDP', () => {
    props.whiteLabelKey = 'CDP';
    const { container } = render(<DeactivateUserContent {...props} />);
    expect(container).toHaveTextContent('Deactivate Humpty Dumpty');
    expect(container).toHaveTextContent(
      'Deactivated users will receive an email notification.',
    );
    expect(container).not.toHaveTextContent(
      'Deactivated users are not charged for. However, if these users have been active at any time during an invoiced calendar month, the user will still be charged for as standard.',
    );
    expect(container).toHaveTextContent(
      'You can reactivate a user that has been deactivated at any time.',
    );
  });

  test('throws an error for an unsupported key', () => {
    // @ts-expect-error Testing invalid key
    props.whiteLabelKey = 'INVALID_KEY';
    expect(() => {
      render(<DeactivateUserContent {...props} />);
    }).toThrow('deactivateUserContentMap entry missing: INVALID_KEY');
  });
});
