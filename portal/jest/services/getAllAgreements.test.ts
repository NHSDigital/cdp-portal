import callLambdaWithFullErrorChecking from '@/app/shared/callLambda';
import getAllAgreements from '@/services/getAllAgreements';

jest.mock('app/shared/callLambda');

describe('getAllAgreements', () => {
  const mockCallLambda = callLambdaWithFullErrorChecking as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GET_ALL_AGREEMENTS_ARN = 'mock-arn';
  });

  it('should call Lambda with default eventfilter and return agreements', async () => {
    const mockAgreements = [{ id: '1', name: 'Agreement 1' }];
    mockCallLambda.mockResolvedValue({
      body: JSON.stringify({ agreements: mockAgreements }),
    });
    const result = await getAllAgreements();

    expect(mockCallLambda).toHaveBeenCalledWith({
      function_name: 'mock-arn',
      raw_payload: {
        filter: {
          attribute: 'PK',
          condition: 'begins_with',
          value: 'agreement-',
        },
      },
      logger: expect.any(Object),
    });

    expect(result).toEqual(mockAgreements);
  });

  it('should use custom eventfilter when provided', async () => {
    const mockAgreements = [{ id: '2', name: 'Agreement B' }];
    mockCallLambda.mockResolvedValue({
      body: JSON.stringify({ agreements: mockAgreements }),
    });

    const result = await getAllAgreements('custom-filter');

    expect(mockCallLambda).toHaveBeenCalledWith(
      expect.objectContaining({
        raw_payload: {
          filter: {
            attribute: 'PK',
            condition: 'begins_with',
            value: 'custom-filter',
          },
        },
      }),
    );

    expect(result).toEqual(mockAgreements);
  });

  it('should throw if Lambda call fails', async () => {
    mockCallLambda.mockRejectedValue(new Error('Lambda error'));

    await expect(getAllAgreements()).rejects.toThrow('Lambda error');
  });

  it('should throw if response body is invalid JSON', async () => {
    mockCallLambda.mockResolvedValue({ body: 'invalid-json' });

    await expect(getAllAgreements()).rejects.toThrow();
  });
});
