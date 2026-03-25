import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import MaintenancePage, { generateMetadata } from '@/app/maintenance/page';
import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import { checkAccessibility } from '../utils';

describe('MaintenancePage tests', () => {
  it('renders the correct content', async () => {
    const { container } = render(MaintenancePage());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Service is unavailable',
    );
    expect(
      screen.getByText(
        'This service is currently undergoing maintenance and will be available soon. This should not take more than a few hours.',
      ),
    ).toBeInTheDocument();
    const contact_us = screen.getByText(/urgent issue/i).closest('p');
    expect(contact_us).toHaveTextContent(
      `If you have an urgent issue, contact the National Service Desk on ${NATIONAL_SERVICE_DESK_TELEPHONE} or email ${NATIONAL_SERVICE_DESK_EMAIL}`,
    );

    const emailLink = screen.getByRole('link', {
      name: NATIONAL_SERVICE_DESK_EMAIL,
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute(
      'href',
      `mailto:${NATIONAL_SERVICE_DESK_EMAIL}`,
    );
    expect(emailLink).toHaveAttribute('target', '_blank');
    expect(emailLink).toHaveAttribute('rel', 'noopener noreferrer');

    await checkAccessibility(container);
  });

  it('returns metadata with the correct title', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: `Maintenance page - ${whiteLabelValues.acronym}`,
    });
  });
});
