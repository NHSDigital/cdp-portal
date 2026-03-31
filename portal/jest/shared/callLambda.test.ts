import { Logger } from 'pino';

import callLambdaWithFullErrorChecking, {
  callLambdaWithoutFullErrorChecking,
} from '@/app/shared/callLambda';
import { logAndError } from '@/app/shared/common';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => {
    return { send: jest.fn((command) => mockSend(command)) };
  }),
  InvokeCommand: jest.fn(),
}));

jest.mock('@/app/shared/common', () => ({
  logAndError: jest.fn(),
}));

const mockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
});

describe('callLambda tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const logger = mockLogger() as unknown as Logger;
  test('returns parsed JSON on success', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({ ok: true, statusCode: 200 })),
      FunctionError: undefined,
    });

    const result = await callLambdaWithFullErrorChecking({
      function_name: 'testLambda',
      raw_payload: { a: 1 },
      logger: logger,
      log_result: true,
    });

    expect(result).toEqual({ ok: true, statusCode: 200 });
    expect(logAndError).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Calling lambda');
    expect(logger.info).toHaveBeenCalledWith({
      resultJson: { ok: true, statusCode: 200 },
    });
    expect(logger.info).toHaveBeenCalledWith('Lambda call successful');
  });

  test('calls logAndError when StatusCode is non-2xx', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 500,
      Payload: Buffer.from('{}'),
      FunctionError: undefined,
    });

    await expect(
      callLambdaWithFullErrorChecking({
        function_name: 'badLambda',
        raw_payload: {},
        logger: logger,
        log_result: false,
      }),
    ).resolves.toEqual({});

    expect(logAndError).toHaveBeenCalledWith(
      logger,
      expect.stringContaining(
        'Lambda badLambda gave a non 2xx status code, this is an error',
      ),
    );
  });

  test('calls logAndError when Payload is missing', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 200,
      Payload: undefined,
      FunctionError: undefined,
    });

    await expect(
      callLambdaWithFullErrorChecking({
        function_name: 'missingPayload',
        raw_payload: {},
        logger,
      }),
    ).rejects.toThrow();

    expect(logAndError).toHaveBeenCalledWith(
      logger,
      expect.stringContaining(
        'Lambda missingPayload returned no payload, this is an error',
      ),
    );
  });

  test('calls logAndError when FunctionError exists', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from('{}'),
      FunctionError: 'UnhandledError',
    });

    await callLambdaWithFullErrorChecking({
      function_name: 'errorLambda',
      raw_payload: {},
      logger,
    });

    expect(logger.error).toHaveBeenCalled();
    expect(logAndError).toHaveBeenCalledWith(
      logger,
      expect.stringContaining('Lambda errorLambda returned a FunctionError'),
    );
  });

  test('calls logAndError when function_name ends with change_user_activation', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from('{}'),
      FunctionError: undefined,
    });

    await callLambdaWithFullErrorChecking({
      function_name: 'lambda_change_user_activation',
      raw_payload: {},
      logger,
    });

    expect(logger.error).toHaveBeenCalledWith(
      { FunctionError: undefined, StatusCode: 200 },
      'RES!!!',
    );
  });

  test('can call callLambdaWithoutFullErrorChecking directly', async () => {
    mockSend.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({ ok: true, statusCode: 200 })),
      FunctionError: undefined,
    });

    const result = await callLambdaWithoutFullErrorChecking({
      function_name: 'lalalalalalambda',
      raw_payload: {},
      logger: logger,
    });

    expect(result).toStrictEqual({ ok: true, statusCode: 200 });
  });
});
