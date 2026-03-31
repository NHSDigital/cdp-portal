import { render, screen } from '@testing-library/react';
import React from 'react';

import confirmChangeActivationStatus, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/page';
import getAgreementUserDetails from '@/app/services/getAgreementUserDetails';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('@/app/services/getAgreementUserDetails');
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/confirmChangeActivationPage',
  () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid='mock-confirm-component' />),
  }),
);

describe('confirmChangeActivationStatus tests', () => {
  const mockParams = {
    agreement_id: 'agreement-123',
    user: encodeURIComponent('user@test.com'),
  };

  const mockUserDetails = {
    first_name: 'Jane',
    last_name: 'Doe',
    enabled_agreement: true,
    enabled_global: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ConfirmChangeActivationPage with correct props', async () => {
    (getAgreementUserDetails as jest.Mock).mockResolvedValue(mockUserDetails);

    const result = await confirmChangeActivationStatus({ params: mockParams });

    render(result);

    expect(getAgreementUserDetails).toHaveBeenCalledWith(
      'agreement-123',
      'user@test.com',
    );

    const child = await screen.findByTestId('mock-confirm-component');
    expect(child).toBeInTheDocument();
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Confirm change activation - ${whiteLabelValues.acronym}`,
    );
  });
});
