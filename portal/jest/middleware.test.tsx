/* git-secrets:allow */

import { NextFetchEvent, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequestWithAuth } from 'next-auth/middleware';

import hasPermissions from '@/app/services/hasPermissions';
import { Actions } from '@/config/constants';
import WithAuth, { config } from '@/proxy';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));
jest.mock('next-auth/middleware', () => ({
  withAuth: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('@/app/services/hasPermissions', () => jest.fn());

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}));

describe('middleware tests', () => {
  const makeRequest = (
    path: string,
    urlBase = 'https://middleware.test',
  ): Partial<NextRequestWithAuth> => {
    const urlString = `${urlBase}${path.startsWith('/') ? '' : '/'}${path}`;

    return {
      url: urlString,
      nextUrl: new URL(urlString) as unknown as NextRequestWithAuth['nextUrl'],
      headers: new Headers(),
    };
  };

  const originalEnv = process.env;
  const mockEvent = {} as unknown as NextFetchEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows normal access when maintenance mode is off', async () => {
    process.env.MAINTENANCE_MODE = 'false';
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = makeRequest(
      '/agreement/dsa-000000-qad01',
    ) as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('handles missing MAINTENANCE_MODE env variable gracefully', async () => {
    delete process.env.MAINTENANCE_MODE;
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = makeRequest(
      '/agreement/dsa-000000-qad01',
    ) as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('redirects to /maintenance if maintenance mode is on and user lacks permissions', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (getToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    const req = makeRequest(
      '/agreement/dsa-000000-qad01',
    ) as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: Actions.MAINTENANCE_ACCESS,
      agreement_id: 'dsa-000000-qad01',
      user_email: 'user@test.com',
    });

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('/maintenance', req.url),
    );
  });

  it('redirects to /maintenance if maintenance mode is on and user attempts password setup', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (getToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    const req = makeRequest('/set-up-password') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: Actions.MAINTENANCE_ACCESS,
      agreement_id: undefined,
      user_email: 'user@test.com',
    });
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('/maintenance', req.url),
    );
  });

  it('allows access to /maintenance page when maintenance mode is on', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (getToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    const req = makeRequest('/maintenance') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('allows users with maintainer permission during maintenance mode', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (getToken as jest.Mock).mockResolvedValue({ email: 'maintainer@test.com' });
    (hasPermissions as jest.Mock).mockResolvedValue(true);

    const req = makeRequest(
      '/agreement/dsa-000000-qad01',
    ) as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('redirects logged-in users away from password setup flow routes', async () => {
    (getToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });

    const req = makeRequest('/set-up-password') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('/404', req.url),
    );
  });

  it('allows unauthenticated users to access password setup flow routes', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('/confirm-email-address') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('allows access to /logout_confirm when maintenance mode is on', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (getToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    const req = makeRequest('/logout_confirm') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('covers authorized() callback for /maintenance with no token', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('/maintenance') as NextRequestWithAuth;
    await WithAuth(req, mockEvent);

    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('covers authorized() callback for password setup routes with no token', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const paths = [
      '/set-up-password',
      '/confirm-email-address',
      '/link-expired',
    ];
    for (const path of paths) {
      const req = makeRequest(path);
      await WithAuth(req as NextRequestWithAuth, mockEvent);
      expect(NextResponse.next).toHaveBeenCalled();
    }
  });

  it('should have the correct matcher pattern', () => {
    expect(config.matcher[0]).toContain('api');
  });
});

import { authOptions } from '@/proxy';

describe('authorized callback tests', () => {
  const authorized = authOptions.callbacks.authorized;
  const makeReq = (path) => ({ nextUrl: { pathname: path } });
  const key = 'token';

  it('returns true for password setup routes with no token', () => {
    expect(authorized({ req: makeReq('/set-up-password'), [key]: null })).toBe(
      true,
    );
  });

  it('returns true for /maintenance with no token', () => {
    expect(authorized({ req: makeReq('/maintenance'), [key]: null })).toBe(
      true,
    );
  });

  it('returns true when token exists', () => {
    expect(
      authorized({
        req: makeReq('/dashboard'),
        [key]: { email: 'user@test.com' },
      }),
    ).toBe(true);
  });

  it('returns false when no token and not on allowed routes', () => {
    expect(authorized({ req: makeReq('/dashboard'), [key]: null })).toBe(false);
  });
});
