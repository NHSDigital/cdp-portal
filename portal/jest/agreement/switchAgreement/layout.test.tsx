import { getServerSession } from 'next-auth';
import { renderToString } from 'react-dom/server';

import SwitchAgreementLayout from '@/app/agreement/[agreement_id]/switchagreement/layout';
import hasPermissions from '@/app/services/hasPermissions';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/services/hasPermissions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/app/(errors)/403/page', () => ({
  __esModule: true,
  default: () => <div>403 Forbidden</div>,
}));

describe('SwitchAgreementLayout', () => {
  const mockChildren = <div>Child content</div>;
  const params = { agreement_id: 'AG123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 403 page if no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const element = await SwitchAgreementLayout({
      children: mockChildren,
      params,
    });
    const html = renderToString(element);

    expect(html).toContain('403 Forbidden');
    expect(getServerSession).toHaveBeenCalledTimes(1);
    expect(hasPermissions).not.toHaveBeenCalled();
  });

  it('renders 403 page if user has no email in session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });

    const element = await SwitchAgreementLayout({
      children: mockChildren,
      params,
    });
    const html = renderToString(element);

    expect(html).toContain('403 Forbidden');
    expect(hasPermissions).not.toHaveBeenCalled();
  });

  it('renders 403 page if user lacks permission', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    const element = await SwitchAgreementLayout({
      children: mockChildren,
      params,
    });
    const html = renderToString(element);

    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: ['vdi.open_agreement'],
      agreement_id: 'AG123',
      user_email: 'test@example.com',
    });
    expect(html).toContain('403 Forbidden');
  });

  it('renders children if user has permission', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    (hasPermissions as jest.Mock).mockResolvedValue(true);

    const element = await SwitchAgreementLayout({
      children: mockChildren,
      params,
    });
    const html = renderToString(element);

    expect(html).toContain('Child content');
    expect(html).not.toContain('403 Forbidden');
  });
});
