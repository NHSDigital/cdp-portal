import { render } from '@testing-library/react';

import parseInductionCookie from '@/app/induction/_components/inductionCookie';
import QuestionClient from '@/app/induction/question/[question_number]/_components/questionClient';
import {
  getBackLinkPath,
  goToFirstUnansweredQuestion,
} from '@/app/induction/question/[question_number]/_components/questionHelper';
import submitQuestionAnswer from '@/app/induction/question/[question_number]/_components/serverActions';
import QuestionPage from '@/app/induction/question/[question_number]/page';
import { getByDataCy } from '@/jest/utils';

jest.mock('@/app/induction/_components/inductionCookie', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock(
  '@/app/induction/question/[question_number]/_components/questionHelper',
  () => ({
    getBackLinkPath: jest.fn(),
    goToFirstUnansweredQuestion: jest.fn(),
  }),
);

jest.mock(
  '@/app/induction/question/[question_number]/_components/questionClient',
  () => ({
    __esModule: true,
    default: jest.fn(
      ({
        saved_question,
        question_number,
        goBackLinkPath,
        isFinalQuestion,
      }) => (
        <div data-testid='mock-question-client'>
          <div>Question Number: {question_number}</div>
          <div>Saved Question: {JSON.stringify(saved_question)}</div>
          <div>Go Back Link: {goBackLinkPath}</div>
          <div>Is Final Question: {String(isFinalQuestion)}</div>
        </div>
      ),
    ),
  }),
);
jest.mock(
  '@/app/induction/question/[question_number]/_components/serverActions',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

describe('QuestionPage tests', () => {
  const mockParseInductionCookie = parseInductionCookie as jest.Mock;
  const mockGetBackLinkPath = getBackLinkPath as jest.Mock;
  const mockGoToFirstUnansweredQuestion =
    goToFirstUnansweredQuestion as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders QuestionClient with correct props when there are wrong answers', async () => {
    mockParseInductionCookie.mockResolvedValue({
      cookie_answers: {
        1: [1],
        2: [2],
      },
      cookie_wrong: [4, 5],
    });
    mockGetBackLinkPath.mockReturnValue('/induction/question/4');
    const mockSubmit = jest.fn();
    (submitQuestionAnswer as jest.Mock).mockImplementation(mockSubmit);

    render(await QuestionPage({ params: { question_number: '5' } }));

    expect(getByDataCy('induction-question-5')).toBeInTheDocument();
    expect(mockGoToFirstUnansweredQuestion).toHaveBeenCalledWith(
      5,
      { 1: [1], 2: [2] },
      [4, 5],
    );

    expect(mockGetBackLinkPath).toHaveBeenCalledWith({
      current_question_number: 5,
      cookie_wrong: [4, 5],
    });

    expect(QuestionClient).toHaveBeenCalledWith(
      expect.objectContaining({
        saved_question: undefined,
        question_number: 5,
        goBackLinkPath: '/induction/question/4',
        isFinalQuestion: true,
        submitQuestionAnswer: expect.any(Function),
      }),
      expect.anything(),
    );
  });

  it('sets final question to true when no wrong answers and on question 10', async () => {
    mockParseInductionCookie.mockResolvedValue({
      cookie_answers: {
        10: [2],
      },
      cookie_wrong: [],
    });

    mockGetBackLinkPath.mockReturnValue('/induction/question/9');

    render(await QuestionPage({ params: { question_number: '10' } }));

    expect(getByDataCy('induction-question-10')).toBeInTheDocument();
    expect(goToFirstUnansweredQuestion).toHaveBeenCalledWith(
      10,
      { 10: [2] },
      [],
    );
    expect(mockGetBackLinkPath).toHaveBeenCalledWith({
      current_question_number: 10,
      cookie_wrong: [],
    });

    expect(QuestionClient).toHaveBeenCalledWith(
      expect.objectContaining({
        saved_question: [2],
        question_number: 10,
        goBackLinkPath: '/induction/question/9',
        isFinalQuestion: true,
        submitQuestionAnswer: expect.any(Function),
      }),
      expect.anything(),
    );
  });

  it('sets final question to false if not on final wrong question', async () => {
    mockParseInductionCookie.mockResolvedValue({
      cookie_answers: {
        3: [0],
      },
      cookie_wrong: [3, 5],
    });
    mockGetBackLinkPath.mockReturnValue('/induction/question/2');

    render(await QuestionPage({ params: { question_number: '3' } }));

    expect(getByDataCy('induction-question-3')).toBeInTheDocument();
    expect(QuestionClient).toHaveBeenCalledWith(
      expect.objectContaining({
        isFinalQuestion: false,
      }),
      expect.anything(),
    );
  });

  it('renders with saved_question undefined if not answered yet', async () => {
    mockParseInductionCookie.mockResolvedValue({
      cookie_answers: {},
      cookie_wrong: [],
    });
    mockGetBackLinkPath.mockReturnValue('/induction/question/1');

    render(await QuestionPage({ params: { question_number: '1' } }));

    expect(getByDataCy('induction-question-1')).toBeInTheDocument();
    expect(QuestionClient).toHaveBeenCalledWith(
      expect.objectContaining({
        saved_question: undefined,
      }),
      expect.anything(),
    );
  });
});
