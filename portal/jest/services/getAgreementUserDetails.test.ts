import { callLambdaWithoutFullErrorChecking } from 'app/shared/callLambda';
import { getLoggerAndSession } from 'app/shared/logging';
import { notFound } from 'next/navigation';

import getAgreementUserDetails from '@/app/services/getAgreementUserDetails';
import {
  calculateUserStatus,
  changeBasicAgreementAccessToAnalyst,
} from '@/app/services/getUsersInAgreement';

jest.mock('app/shared/callLambda');
jest.mock('app/shared/logging');
jest.mock('next/navigation');
jest.mock('@/app/services/getUsersInAgreement');

describe('getAgreementUserDetails', () => {
  const mockLogger = { info: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
    });
    (changeBasicAgreementAccessToAnalyst as jest.Mock).mockImplementation(
      (u) => u,
    );
    (calculateUserStatus as jest.Mock).mockImplementation((u) => u);
  });

  it('should return user details when statusCode is 200', async () => {
    const mockUser = { name: 'John Doe' };
    (callLambdaWithoutFullErrorChecking as jest.Mock).mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify(mockUser),
    });

    const result = await getAgreementUserDetails(
      'agreement123',
      'john@example.com',
    );

    expect(callLambdaWithoutFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        function_name: expect.any(String),
        raw_payload: {
          user_email: 'john@example.com',
          agreement_id: 'agreement123',
        },
      }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith({
      message: 'Successfully retrieved user details',
    });
    expect(result).toEqual(mockUser);
  });

  it('should call notFound when statusCode is 404', async () => {
    (callLambdaWithoutFullErrorChecking as jest.Mock).mockResolvedValue({
      statusCode: 404,
    });

    await expect(
      getAgreementUserDetails('agreement123', 'john@example.com'),
    ).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404 }),
    );
    expect(notFound).toHaveBeenCalled();
  });

  it('should throw error when statusCode is not 200 or 404', async () => {
    (callLambdaWithoutFullErrorChecking as jest.Mock).mockResolvedValue({
      statusCode: 500,
    });

    await expect(
      getAgreementUserDetails('agreement123', 'john@example.com'),
    ).rejects.toThrow('Error getting agreement user details');
  });

  it('should handle NEXT_NOT_FOUND error in catch block', async () => {
    const error = { digest: 'NEXT_NOT_FOUND' };
    (callLambdaWithoutFullErrorChecking as jest.Mock).mockRejectedValue(error);

    await expect(
      getAgreementUserDetails('agreement123', 'john@example.com'),
    ).rejects.toThrow();
    expect(notFound).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404 }),
    );
  });

  it('should handle generic error in catch block', async () => {
    const error = new Error('Something went wrong');
    (callLambdaWithoutFullErrorChecking as jest.Mock).mockRejectedValue(error);

    await expect(
      getAgreementUserDetails('agreement123', 'john@example.com'),
    ).rejects.toThrow('Error getting agreement user details');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
    );
  });
});
