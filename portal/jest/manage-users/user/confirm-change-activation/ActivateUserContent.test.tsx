import { render } from '@testing-library/react';

import {
  ActivateUserContent,
  ActivateUserContentProps,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/ActivateUserContent';

const props: ActivateUserContentProps = {
  usersFullName: 'Humpty Dumpty',
  whiteLabelKey: 'SDE',
};
describe('ActivateUserContent', () => {
  it('renders correctly for SDE', () => {
    const { container } = render(<ActivateUserContent {...props} />);
    expect(container).toHaveTextContent('Reactivate Humpty Dumpty');
    expect(container).toHaveTextContent(
      'Reactivated users will receive an email notification.',
    );
    expect(container).toHaveTextContent(
      'Users are charged the full standard fee for the month. For example, if you reactivate a user in June, they will be charged for the whole month of June.',
    );
  });

  it('renders correctly for CDP', () => {
    props.whiteLabelKey = 'CDP';
    const { container } = render(<ActivateUserContent {...props} />);
    expect(container).toHaveTextContent('Reactivate Humpty Dumpty');
    expect(container).toHaveTextContent(
      'Reactivated users will receive an email notification.',
    );
    expect(container).not.toHaveTextContent(
      'Users are charged the full standard fee for the month. For example, if you reactivate a user in June, they will be charged for the whole month of June.',
    );
  });

  it('throws an error for an unsupported key', () => {
    // @ts-expect-error Testing invalid key
    props.whiteLabelKey = 'INVALID_KEY';
    expect(() => {
      render(<ActivateUserContent {...props} />);
    }).toThrow('activateUserContentMap entry missing: INVALID_KEY');
  });
});
