import callLambdaWithFullErrorChecking from '@/app/shared/callLambda';
import { getWhiteLabelValues } from '@/config/whiteLabel';

const mockLogger = { info: jest.fn(), error: jest.fn() };
jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn(() => mockLogger),
}));

jest.mock('@/app/shared/callLambda');

const email = 'testy@test.com';
const whiteLabelValues = getWhiteLabelValues();

describe(' confirm email address server actions tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USER_PASSWORD_SETUP_SERVICE_ARN = 'arn:aws:lambda:test';
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({});
  });

  const {
    invokeResendEmail,
  } = require('@/app/(password-setup)/link-expired/_components/serverActions');
  it('calls callLambdaWithFullErrorChecking with the correct payload', async () => {
    const formData = new FormData();
    formData.set('email', email);

    await invokeResendEmail({ success: false }, formData);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledTimes(1);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith({
      function_name: 'arn:aws:lambda:test',
      raw_payload: {
        event_type: 'resend_email',
        user_email: email,
        service: whiteLabelValues.acronym,
      },
      logger: mockLogger,
      log_result: true,
    });
  });

  it('returns { success: true } when call succeeds', async () => {
    const formData = new FormData();
    formData.set('email', email);
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({});

    const result = await invokeResendEmail({ success: false }, formData);

    expect(result).toEqual({ success: true });
  });

  it('initializes the logger with the correct name', () => {
    jest.resetModules();
    const mockGetLogger = jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
    }));
    jest.doMock('helpers/logging/logger', () => ({ getLogger: mockGetLogger }));
    require('@/app/(password-setup)/link-expired/_components/serverActions');

    expect(mockGetLogger).toHaveBeenCalledWith('callUserPasswordSetupService');
  });

  it('throws if callLambdaWithFullErrorChecking rejects', async () => {
    const formData = new FormData();
    formData.set('email', email);

    (callLambdaWithFullErrorChecking as jest.Mock).mockRejectedValue(
      new Error('Lambda failed'),
    );

    await expect(
      invokeResendEmail({ success: false }, formData),
    ).rejects.toThrow('Lambda failed');
  });
});
