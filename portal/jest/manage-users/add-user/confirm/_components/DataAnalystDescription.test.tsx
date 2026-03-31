import { render } from '@testing-library/react';

import { DataAnalystDescription } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/DataAnalystDescription';

describe('DataAnalystDescription', () => {
  it('renders correctly when key is SDE', async () => {
    const { container } = render(
      <DataAnalystDescription whiteLabelKey='SDE' />,
    );
    expect(container).toHaveTextContent(
      'New Data Analysts will be sent an email to an online induction and assessment. Once they have passed this induction, these users will be activated and charged for.',
    );
  });

  it('renders correctly when key is CDP', () => {
    const { container } = render(
      <DataAnalystDescription whiteLabelKey='CDP' />,
    );
    expect(container).toHaveTextContent(
      'New Data Analysts will be activated and sent an email to set up their account.',
    );
  });

  it('throws an error for an unsupported key', () => {
    expect(() => {
      // @ts-expect-error Testing unsupported key
      render(<DataAnalystDescription whiteLabelKey='UNSUPPORTED_KEY' />);
    }).toThrow('dataAnalystDescriptionMap entry is missing: UNSUPPORTED_KEY');
  });
});
