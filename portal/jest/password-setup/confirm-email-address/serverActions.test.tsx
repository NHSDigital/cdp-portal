import callLambdaWithFullErrorChecking from 'app/shared/callLambda';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { invokeVerifyEmailAddress } from '@/app/(password-setup)/confirm-email-address/_components/serverActions';
import { CookieNames } from '@/config/constants';

jest.mock('app/shared/callLambda');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn().mockReturnValue({ info: jest.fn(), error: jest.fn() }),
}));

describe('invokeVerifyEmailAddress tests', () => {
  const mockSet = jest.fn();
  const mockCookies = { set: mockSet };

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockReturnValue(mockCookies);
    process.env.USER_PASSWORD_SETUP_SERVICE_ARN = 'arn:aws:lambda:test';
  });

  const createFormData = (email: string, id: string) => {
    const fd = new FormData();
    fd.set('email_address', email);
    fd.set('id', id);
    return fd;
  };

  it('returns validation error when email is invalid', async () => {
    const formData = createFormData('invalid-email', '123');

    const result = await invokeVerifyEmailAddress({}, formData);

    expect(result).toEqual({ error: 'This is not a valid email.' });
    expect(callLambdaWithFullErrorChecking).not.toHaveBeenCalled();
  });

  it('redirects to /set-up-password when valid email and guid', async () => {
    const formData = createFormData('test@example.com', '123');
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({ valid_email: true, valid_guid: true }),
    });

    await invokeVerifyEmailAddress({}, formData);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        function_name: 'arn:aws:lambda:test',
        raw_payload: expect.objectContaining({
          event_type: 'verify_email_address',
          user_email: 'test@example.com',
          guid: '123',
        }),
      }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      CookieNames.CONFIRMED_EMAIL,
      'test@example.com',
      expect.objectContaining({ secure: true, maxAge: 300 }),
    );
    expect(redirect).toHaveBeenCalledWith('/set-up-password?id=123');
  });

  it('returns error when password already set up', async () => {
    const formData = createFormData('test@example.com', '123');
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        valid_email: false,
        valid_guid: false,
        message: 'The user has already setup their password',
      }),
    });

    const result = await invokeVerifyEmailAddress({}, formData);

    expect(result).toEqual({ error: 'Password has already been set up' });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to /link-expired when guid expired', async () => {
    const formData = createFormData('test@example.com', '123');
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        valid_email: false,
        valid_guid: false,
        message: 'The provided guid has expired',
      }),
    });

    await invokeVerifyEmailAddress({}, formData);

    expect(mockSet).toHaveBeenCalledWith(
      CookieNames.CONFIRMED_EMAIL,
      'test@example.com',
      expect.objectContaining({ secure: true, maxAge: 300 }),
    );
    expect(redirect).toHaveBeenCalledWith('/link-expired');
  });

  it('returns default error for other invalid responses', async () => {
    const formData = createFormData('test@example.com', '123');
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        valid_email: false,
        valid_guid: false,
        message: 'Some other error',
      }),
    });

    const result = await invokeVerifyEmailAddress({}, formData);

    expect(result).toEqual({
      error: 'Enter the email address used to set up your account',
    });
  });
});
