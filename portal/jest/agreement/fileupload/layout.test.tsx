import { render } from '@testing-library/react';
import IsSDEAgreement from 'helpers/agreementidHelper';
import { getServerSession } from 'next-auth';
import React from 'react';

import FileUploadLayout from '@/app/agreement/[agreement_id]/fileupload/layout';
import hasPermissions from '@/app/services/hasPermissions';

jest.mock('helpers/agreementidHelper', () => jest.fn());
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/app/services/hasPermissions', () => jest.fn());
jest.mock('@/app/(errors)/403/page', () =>
  jest.fn(() => <div>403 Forbidden</div>),
);

describe('FileUploadLayout tests', () => {
  const mockChildren = <div>Allowed Content</div>;
  const mockAgreementId = 'pumpkin-spiced-agreement';
  const mockEmail = 'jacko@lantern.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: mockEmail },
    });
  });

  it('renders 403 if there is no user email', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: null },
    });
    (IsSDEAgreement as jest.Mock).mockResolvedValueOnce(true);

    const result = await FileUploadLayout({
      children: mockChildren,
      params: Promise.resolve({ agreement_id: mockAgreementId }),
    });

    const { container } = render(result as React.ReactElement);
    expect(container).toHaveTextContent('403 Forbidden');
    expect(IsSDEAgreement).toHaveBeenCalledWith(mockAgreementId);
  });

  it('renders 403 if agreement is not SDE', async () => {
    (IsSDEAgreement as jest.Mock).mockResolvedValueOnce(false);

    const result = await FileUploadLayout({
      children: mockChildren,
      params: Promise.resolve({ agreement_id: mockAgreementId }),
    });

    const { container } = render(result as React.ReactElement);
    expect(container).toHaveTextContent('403 Forbidden');
  });

  it('renders 403 if user does not have permission', async () => {
    (IsSDEAgreement as jest.Mock).mockResolvedValueOnce(true);
    (hasPermissions as jest.Mock).mockResolvedValueOnce(false);

    const result = await FileUploadLayout({
      children: mockChildren,
      params: Promise.resolve({ agreement_id: mockAgreementId }),
    });

    const { container } = render(result as React.ReactElement);
    expect(container).toHaveTextContent('403 Forbidden');
    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: ['data_in.upload_file'],
      agreement_id: mockAgreementId,
      user_email: mockEmail,
    });
  });

  it('renders children if user has permission', async () => {
    (IsSDEAgreement as jest.Mock).mockResolvedValueOnce(true);
    (hasPermissions as jest.Mock).mockResolvedValueOnce(true);

    const result = await FileUploadLayout({
      children: mockChildren,
      params: Promise.resolve({ agreement_id: mockAgreementId }),
    });

    const { container } = render(result as React.ReactElement);
    expect(container).toHaveTextContent('Allowed Content');
    expect(container).not.toHaveTextContent('403 Forbidden');
  });
});
