import * as navigation from 'next/navigation';

import * as inductionCookie from '@/app/induction/_components/inductionCookie';
import submitQuestionAnswer from '@/app/induction/question/[question_number]/_components/serverActions';
import callLambdaWithFullErrorChecking from '@/app/shared/callLambda';

jest.mock('@/app/induction/_components/inductionCookie', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    cookie_answers: {},
    cookie_wrong: [],
  }),
  setInductionCookie: jest.fn(),
}));
jest.mock('@/app/shared/callLambda', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/app/shared/logging', () => ({
  getLoggerAndSession: jest.fn().mockResolvedValue({
    logger: { child: jest.fn(() => ({})) },
    session: {
      user: {
        email: 'test@example.com',
      },
    },
  }),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock(
  '@/app/induction/question/[question_number]/_components/consts',
  () => {
    const actual = jest.requireActual(
      '@/app/induction/question/[question_number]/_components/consts',
    );
    return {
      ...actual,
      QUESTIONS_ARRAY: [
        {
          ...actual.QUESTIONS_ARRAY[0],
          type: actual.SINGLE_CHOICE_KEY,
          heading: 'How many legs does a silverfish have?',
          options: ['Eight', 'Four', 'Six'],
          answers: ['Six'],
        },
        {
          ...actual.QUESTIONS_ARRAY[1],
          type: actual.MULTIPLE_CHOICE_KEY,
          heading:
            'Which of the following insect types have been sent into speace?',
          options: [
            'Earwigs',
            'Fruit Flies',
            'Ants',
            'Cockroaches',
            'Silverfish',
          ],
          answers: ['Fruit Flies', 'Ants'],
        },
      ],
    };
  },
);

const mockParseInductionCookie = inductionCookie.default as jest.Mock;

describe('submitQuestionAnswer tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns error if no options selected for single choice question', async () => {
    const form_data = new FormData();
    const result = await submitQuestionAnswer(
      { question_number: 1 },
      {},
      form_data,
    );
    expect(result).toEqual({ error: 'You must select an option to continue' });
  });

  it('returns error if no options selected for multiple choice question', async () => {
    const form_data = new FormData();
    const result = await submitQuestionAnswer(
      { question_number: 2 },
      {},
      form_data,
    );
    expect(result).toEqual({
      error: 'You must select at least one option to continue',
    });
  });

  it('redirects to next question if selection is made and not in wrong flow', async () => {
    const formData = new FormData();
    formData.append('question_1', 'Six');

    await submitQuestionAnswer({ question_number: 1 }, {}, formData);

    expect(inductionCookie.setInductionCookie).toHaveBeenCalled();
    expect(navigation.redirect).toHaveBeenCalledWith('/induction/question/2');
  });

  it('redirects to next wrong question if in wrong flow and not last wrong', async () => {
    mockParseInductionCookie.mockResolvedValueOnce({
      cookie_answers: {},
      cookie_wrong: [2, 3],
    });

    const formData = new FormData();
    formData.append('question_2', 'X');

    await submitQuestionAnswer({ question_number: 2 }, {}, formData);

    expect(inductionCookie.setInductionCookie).toHaveBeenCalled();
    expect(navigation.redirect).toHaveBeenCalledWith('/induction/question/3');
  });

  it('marks answers and redirects to not-passed if last wrong question and incorrect', async () => {
    mockParseInductionCookie.mockResolvedValueOnce({
      cookie_answers: {},
      cookie_wrong: [2],
    });

    const formData = new FormData();
    formData.append('question_2', 'X');

    await submitQuestionAnswer({ question_number: 2 }, {}, formData);

    expect(inductionCookie.setInductionCookie).toHaveBeenCalledWith({}, [2]);
    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(navigation.redirect).toHaveBeenCalledWith('/induction/not-passed');
  });

  it('marks answers and redirects to passed if all answers are correct on last question', async () => {
    mockParseInductionCookie.mockResolvedValueOnce({
      cookie_answers: {
        1: [2],
      },
      cookie_wrong: [],
    });
    const formData = new FormData();
    formData.append('question_1', 'Six');
    formData.append('question_2', 'Fruit Flies');
    formData.append('question_2', 'Ants');

    await submitQuestionAnswer({ question_number: 2 }, {}, formData);

    expect(inductionCookie.setInductionCookie).toHaveBeenNthCalledWith(
      1,
      { 1: [2], 2: [1, 2] },
      [],
    );
    expect(inductionCookie.setInductionCookie).toHaveBeenNthCalledWith(
      2,
      {},
      [],
      true,
    );
    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(navigation.redirect).toHaveBeenCalledWith('/induction/passed');
  });

  it('marks a question as incorrect if no answers are provided for it', async () => {
    mockParseInductionCookie.mockResolvedValueOnce({
      cookie_answers: {
        2: [1, 2],
      },
      cookie_wrong: [],
    });

    const formData = new FormData();
    formData.append('question_2', 'Fruit Flies');
    formData.append('question_2', 'Ants');

    await submitQuestionAnswer({ question_number: 2 }, {}, formData);

    expect(inductionCookie.setInductionCookie).toHaveBeenNthCalledWith(2, {}, [
      1,
    ]);
    expect(navigation.redirect).toHaveBeenCalledWith('/induction/not-passed');
  });
});
