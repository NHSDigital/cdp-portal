import callLambdaWithFullErrorChecking from 'app/shared/callLambda';
import { redirect } from 'next/navigation';

import {
  invokeSetUpPassword,
  verifyEmailAndGUID,
} from '@/app/(password-setup)/set-up-password/_components/serverActions';

jest.mock('app/shared/callLambda');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('password setup serverActions tests', () => {
  (callLambdaWithFullErrorChecking as jest.Mock) =
    callLambdaWithFullErrorChecking as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USER_PASSWORD_SETUP_SERVICE_ARN = 'test-arn';
  });

  function makeFormData(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    return formData;
  }

  it('returns error if no password is entered', async () => {
    const formData = makeFormData({
      enter_password: '',
      confirm_password: '',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result).toEqual({
      errors: { enter_password: ['Enter a password'] },
    });
  });

  it('returns error if passwords do not match', async () => {
    const formData = makeFormData({
      enter_password: 'Password123!',
      confirm_password: 'Different123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result).toEqual({
      errors: { confirm_password: ['Passwords must match'] },
    });
  });

  it('returns validation error if password is too short', async () => {
    const formData = makeFormData({
      enter_password: 'Short123!',
      confirm_password: 'Short123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password must have 14 characters or more',
    );
  });

  it('returns validation error if password has 0 lowercase letters', async () => {
    const formData = makeFormData({
      enter_password: 'LALALALALALALA123!',
      confirm_password: 'LALALALALALALA123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password must have at least one lowercase letter',
    );
  });

  it('returns validation error if password has 0 uppercase letters', async () => {
    const formData = makeFormData({
      enter_password: 'lalalalala123!',
      confirm_password: 'lalalalala123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password must have at least one uppercase letter',
    );
  });

  it('returns validation error if password has 0 numbers', async () => {
    const formData = makeFormData({
      enter_password: 'Lalalalalalala!',
      confirm_password: 'Lalalalalalala!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password must have at least one number',
    );
  });

  it('returns validation error if password has 0 special characters', async () => {
    const formData = makeFormData({
      enter_password: 'Lalalalalalala123',
      confirm_password: 'Lalalalalalala123',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password must contain at least one special character',
    );
  });

  it('returns validation error if password has repeating characters', async () => {
    const formData = makeFormData({
      enter_password: 'Laaalalalalalala123!',
      confirm_password: 'Laaalalalalalala123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result.errors?.enter_password?.length).toBe(1);
    expect(result.errors?.enter_password?.[0]).toMatch(
      'Password cannot have repeating characters',
    );
  });

  it('returns specific error if password already set up', async () => {
    const formData = makeFormData({
      enter_password: 'ThisIsValid123!',
      confirm_password: 'ThisIsValid123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValueOnce({
      body: JSON.stringify({
        message: 'The user has already setup their password',
      }),
    });

    const result = await invokeSetUpPassword({}, formData);
    expect(result).toEqual({
      errors: { enter_password: ['Password has already been set up'] },
    });
  });

  it('redirects to /welcome if use', async () => {
    const formData = makeFormData({
      enter_password: 'ThisIsValid123!',
      confirm_password: 'ThisIsValid123!',
      user_email: 'user@example.com',
      guid: 'abc',
    });

    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValueOnce({
      body: JSON.stringify({ message: 'Password set successfully' }),
    });

    await invokeSetUpPassword({}, formData);

    expect(callLambdaWithFullErrorChecking as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        function_name: 'test-arn',
        raw_payload: expect.objectContaining({
          event_type: 'set_password',
          user_email: 'user@example.com',
          guid: 'abc',
        }),
      }),
    );
    expect(redirect).toHaveBeenCalledWith('/welcome');
  });

  it('returns false if lambda says guid or email invalid', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({ valid_guid: false, valid_email: true }),
    });

    const result = await verifyEmailAndGUID('user@example.com', 'abc');
    expect(result).toBe(false);
  });

  it('returns true if lambda says both are valid', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({ valid_guid: true, valid_email: true }),
    });

    const result = await verifyEmailAndGUID('user@example.com', 'abc');
    expect(result).toBe(true);
  });
});
