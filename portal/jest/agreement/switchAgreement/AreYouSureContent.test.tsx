import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AreYouSurePage } from '@/app/agreement/[agreement_id]/switchagreement/_components/AreYouSureContent';
import { WhiteLabelEntry } from '@/config/whiteLabel';

jest.mock(
  '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementButton',
  () => ({
    __esModule: true,
    default: ({
      children,
      open_using,
      switchAgreementCb,
    }: {
      children: React.ReactNode;
      open_using?: string;
      switchAgreementCb: (open_using?: string) => Promise<void>;
    }) => (
      <button onClick={() => switchAgreementCb(open_using)}>{children}</button>
    ),
  }),
);

const whiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};
const baseProps = {
  agreement_id: 'AG123',
  switchAgreementCb: jest.fn().mockResolvedValue(undefined),
  appstream_desktop_client_enabled: false,
  whiteLabelValues: whiteLabelValues,
};

describe('AreYouSurePage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = '';
  });

  it('sets the document title correctly', () => {
    render(<AreYouSurePage {...baseProps} />);
    expect(document.title).toBe('Confirm agreement - SDE');
  });

  it('renders correct content', () => {
    render(<AreYouSurePage {...baseProps} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Confirm your agreement selection',
    );
    expect(
      screen.getByText('You are about to open the agreement AG123.'),
    ).toBeInTheDocument();
    const callout = screen.getByText('Warning');
    expect(callout).toHaveClass('nhsuk-warning-callout__label');
    expect(
      screen.getByText(
        'Switching agreements will close any open sessions, and any unsaved work will be lost.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Go back to home')).toHaveAttribute(
      'href',
      '/agreement/AG123',
    );
    expect(screen.getByText('Launch the virtual desktop')).toBeInTheDocument();
    expect(
      screen.queryByText('Launch the virtual desktop using desktop client'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Launch the virtual desktop in the browser'),
    ).not.toBeInTheDocument();
  });

  it('renders both buttons when desktop client is enabled', () => {
    const props = { ...baseProps, appstream_desktop_client_enabled: true };

    render(<AreYouSurePage {...props} />);

    expect(
      screen.getByText('Launch the virtual desktop in the browser'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Launch the virtual desktop using desktop client'),
    ).toBeInTheDocument();
  });

  it('calls switchAgreementCb with correct args', async () => {
    const props = { ...baseProps, appstream_desktop_client_enabled: true };
    render(<AreYouSurePage {...props} />);

    const browserBtn = screen.getByText(
      'Launch the virtual desktop in the browser',
    );
    const desktopBtn = screen.getByText(
      'Launch the virtual desktop using desktop client',
    );

    fireEvent.click(browserBtn);
    expect(baseProps.switchAgreementCb).toHaveBeenCalledWith('browser');

    fireEvent.click(desktopBtn);
    expect(baseProps.switchAgreementCb).toHaveBeenCalledWith('desktop');
  });
});
