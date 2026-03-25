import '@testing-library/jest-dom';

import { act, render, screen, waitFor } from '@testing-library/react';

import SwitchAgreementManager, {
  LoadingState,
  SwitchAgreementContent,
} from '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementContent';
import { WhiteLabelEntry } from '@/config/whiteLabel';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const throwAsyncErrorMock = jest.fn();
jest.mock('@/helpers/errorHelpers', () => ({
  useAsyncError: () => throwAsyncErrorMock,
}));

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState = jest.fn();
});
const whiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};
const baseProps = {
  agreement_id: 'AG123',
  agreement_count: 2,
  appstream_desktop_client_enabled: true,
  whiteLabelValues: whiteLabelValues,
};

describe('SwitchAgreementManager tests', () => {
  it('renders the confirmation page by default', () => {
    render(<SwitchAgreementManager {...baseProps} />);
    expect(
      screen.getByText('Confirm your agreement selection'),
    ).toBeInTheDocument();
  });

  it('renders LoadingAgreement immediately when quick_launch = true', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({ redirect_url: '/redirected' }),
    });
    const mockCb = jest.fn().mockResolvedValue(undefined);
    const props = {
      ...baseProps,
      agreement_count: 1,
      appstream_desktop_client_enabled: false,
      switchAgreementCb: mockCb,
      agreement_loading_state: { state: 'confirmation' } as LoadingState,
    };
    render(<SwitchAgreementContent {...props} />);
    expect(mockCb).toHaveBeenCalled();
    expect(screen.getByText('Loading agreement AG123...')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We are logging you into your agreement. Please wait, this process can take a few minutes.',
      ),
    ).toBeInTheDocument();
  });

  it('navigates to redirect_url after successful switch (browser mode)', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({ redirect_url: '/redirected' }),
    });

    render(<SwitchAgreementManager {...baseProps} />);

    const confirmButton = screen.getByRole('button', {
      name: /Launch the virtual desktop in the browser/,
    });
    await act(async () => confirmButton.click());

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/redirected');
    });
  });

  it('navigates to amazonappstream URL when open_using = desktop', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({ redirect_url: 'https://example.com/session' }),
    });

    render(<SwitchAgreementManager {...baseProps} />);

    const desktopButton = screen.getByRole('button', {
      name: /Launch the virtual desktop using desktop client/i,
    });
    await act(async () => desktopButton.click());

    const call = pushMock.mock.calls[0][0];
    expect(call.startsWith('amazonappstream:')).toBe(true);
    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it('redirects to locked page if backend reports ongoing execution', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 400,
      text: async () => 'Previous execution is still in progress - aborting',
    });

    render(<SwitchAgreementManager {...baseProps} />);

    const confirmButton = screen.getByRole('button', {
      name: /Launch the virtual desktop in the browser/,
    });
    await act(async () => confirmButton.click());

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/agreement/AG123/locked');
  });

  it('calls throwAsyncError on generic fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 400,
      text: async () => 'Terrifying errors occurred',
    });

    render(<SwitchAgreementManager {...baseProps} />);

    const confirmButton = screen.getByRole('button', {
      name: /Launch the virtual desktop in the browser/i,
    });

    await act(async () => confirmButton.click());

    await waitFor(() =>
      expect(throwAsyncErrorMock).toHaveBeenCalledWith(
        'Failed to switch agreement',
      ),
    );
  });

  it('returns null for unknown agreement_loading_state.state', () => {
    const props = {
      ...baseProps,
      appstream_desktop_client_enabled: true,
      switchAgreementCb: jest.fn(),
      agreement_loading_state: 'pumpkin spice latte' as unknown as LoadingState,
    };

    const { container } = render(<SwitchAgreementContent {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns early when hasNavigated.current is true during catch block', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 400,
      text: async () => 'Terrifying errors occurred',
    });

    const { getByText } = render(<SwitchAgreementManager {...baseProps} />);

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    await act(async () => {
      getByText('Launch the virtual desktop in the browser').click();
    });

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
      expect(throwAsyncErrorMock).not.toHaveBeenCalled();
    });
  });

  it('returns early when hasNavigated.current is true after a successful response', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({ redirect_url: '/redirected' }),
    });

    const { getByText } = render(<SwitchAgreementManager {...baseProps} />);

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    await act(async () => {
      getByText('Launch the virtual desktop in the browser').click();
    });

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
      expect(throwAsyncErrorMock).not.toHaveBeenCalled();
    });
  });
});
