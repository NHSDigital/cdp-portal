import { render } from '@testing-library/react';

import { DataAnalystChargeWarning } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/DataAnlaystChargeWarning';

describe('DataAnalystChargeWarning', () => {
  it('renders correctly when key is SDE', async () => {
    const { container } = render(
      <DataAnalystChargeWarning whiteLabelKey='SDE' />,
    );
    expect(container).toHaveTextContent(
      'Important: ImportantData Analysts are charged £435 a month per agreement, not including optional tools such as Stata.This price will increase to £472 a month per agreement from 1 April 2026.Data Analysts will be charged in the first month regardless of when they are activated.User Manager accounts are not charged for.For more information, visit charges to access the SDE (opens in a new window).',
    );
  });

  it('renders correctly when key is CDP', () => {
    const { container } = render(
      <DataAnalystChargeWarning whiteLabelKey='CDP' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('throws an error for an unsupported key', () => {
    expect(() => {
      // @ts-expect-error Testing unsupported key
      render(<DataAnalystChargeWarning whiteLabelKey='UNSUPPORTED_KEY' />);
    }).toThrow(
      'displayDataAnalystChargeWarningMap entry missing: UNSUPPORTED_KEY',
    );
  });
});
