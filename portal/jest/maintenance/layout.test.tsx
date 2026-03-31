import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import React from 'react';

import MaintenanceLayout from '@/app/maintenance/layout';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('MaintenanceLayout tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('redirects to home when MAINTENANCE_MODE is not "true"', async () => {
    process.env.MAINTENANCE_MODE = 'false';
    const mockChildren = <div>Maintenance content</div>;

    await MaintenanceLayout({ children: mockChildren });

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('renders children when MAINTENANCE_MODE is "true"', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    const mockChildren = <div>Maintenance content</div>;

    const result = await MaintenanceLayout({ children: mockChildren });

    render(result as React.ReactElement);
    expect(screen.getByText('Maintenance content')).toBeInTheDocument();

    expect(redirect).not.toHaveBeenCalled();
  });
});
