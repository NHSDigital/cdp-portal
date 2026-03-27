import { render, screen } from '@testing-library/react';
import { useFormState } from 'react-dom';

import { SINGLE_CHOICE_KEY } from '@/app/induction/question/[question_number]/_components/consts';
import QuestionClient from '@/app/induction/question/[question_number]/_components/questionClient';
import { QuestionInputs } from '@/app/induction/question/[question_number]/_components/questionHelper';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { getByDataCy, queryByDataCy } from '@/jest/utils';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn((handler, initialState) => [initialState, handler]),
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
          heading: 'Fishy in a dishy',
          subtext: 'What is your favorite fish?',
          options: ['Salmon', 'Cod', 'Tuna'],
        },
      ],
    };
  },
);

jest.mock(
  '@/app/induction/question/[question_number]/_components/questionHelper',
  () => ({
    QuestionInputs: jest.fn(),
  }),
);

describe('QuestionClient', () => {
  const whiteLabelValues = getWhiteLabelValues();
  const defaultProps = {
    saved_question: [0],
    question_number: 1,
    goBackLinkPath: '/previous',
    isFinalQuestion: false,
    submitQuestionAnswer: jest.fn(),
    whiteLabelValues,
  };

  const mockQuestionInputs = QuestionInputs as jest.Mock;
  const mockUseFormState = useFormState as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when there are no errors', () => {
    mockQuestionInputs.mockReturnValue(
      <div data-testid='mock-question-inputs' />,
    );
    render(<QuestionClient {...defaultProps} />);

    expect(getByDataCy('go-back-link')).toBeInTheDocument();
    expect(getByDataCy('go-back-link')).toHaveAttribute('href', '/previous');
    expect(getByDataCy('error-state')).toBeInTheDocument();
    expect(queryByDataCy('error-state')).not.toHaveClass(
      'nhsuk-form-group--error',
    );
    expect(screen.getByText('Fishy in a dishy')).toBeInTheDocument();
    expect(screen.getByText('What is your favorite fish?')).toBeInTheDocument();
    expect(screen.getByTestId('mock-question-inputs')).toBeInTheDocument();

    const errorLinks = screen.queryAllByRole('link', {
      name: /please select an answer/i,
    });
    expect(errorLinks.length).toBe(0);
  });

  it('renders error summary if state.error is provided', () => {
    mockUseFormState.mockReturnValue([
      { error: 'Please select an answer' },
      jest.fn(),
    ]);

    render(<QuestionClient {...defaultProps} />);

    expect(getByDataCy('error-state')).toBeInTheDocument();
    expect(getByDataCy('error-state')).toHaveTextContent(
      'Please select an answer',
    );
    expect(getByDataCy('error-message')).toBeInTheDocument();
    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(getByDataCy('error-message')?.textContent).toMatch(
      /please select an answer/i,
    );
    expect(queryByDataCy('error-state')).toHaveClass('nhsuk-form-group--error');

    const errorLink = screen.getByRole('link', {
      name: /please select an answer/i,
    });

    expect(errorLink).toHaveAttribute('href', '#question_1-Salmon-input');
  });

  it('focuses on error summary when error is shown', () => {
    mockUseFormState.mockReturnValue([{ error: 'Focus me!' }, jest.fn()]);
    render(<QuestionClient {...defaultProps} />);
    const errorSummary = screen.getByRole('alert');
    expect(document.activeElement).toBe(errorSummary);
  });

  it('sets document title based on heading', () => {
    render(<QuestionClient {...defaultProps} />);
    expect(document.title).toBe('Fishy in a dishy - SDE');
  });

  it('renders Submit Answers button when isFinalQuestion is true', () => {
    render(<QuestionClient {...defaultProps} isFinalQuestion={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Submit Answers');
  });

  it('does not render BackLink when goBackLinkPath is undefined', () => {
    render(<QuestionClient {...defaultProps} goBackLinkPath={undefined} />);
    expect(screen.queryByText('Back')).toBeNull();
  });

  it('passes correct props to QuestionInputs when there is an error', () => {
    mockUseFormState.mockReturnValue([{ error: 'Test error' }, jest.fn()]);

    render(<QuestionClient {...defaultProps} />);

    expect(mockQuestionInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        type: SINGLE_CHOICE_KEY,
        input_group: 'question_1',
        options: ['Salmon', 'Cod', 'Tuna'],
        saved_question: [0],
        error_ids: ['question_1_error'],
      }),
      expect.anything(),
    );
  });

  it('passes undefined error_ids to QuestionInputs when there is no error', () => {
    mockUseFormState.mockReturnValue([{}, jest.fn()]);
    render(<QuestionClient {...defaultProps} />);
    expect(mockQuestionInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        error_ids: undefined,
      }),
      expect.anything(),
    );
  });

  it('passes empty array as saved_question when undefined', () => {
    render(<QuestionClient {...defaultProps} saved_question={undefined} />);
    expect(mockQuestionInputs).toHaveBeenCalledWith(
      expect.objectContaining({
        saved_question: [],
      }),
      expect.anything(),
    );
  });

  it('submits the form and triggers formAction with FormData', () => {
    const mockFormAction = jest.fn();

    const { container } = render(
      <QuestionClient
        {...defaultProps}
        submitQuestionAnswer={mockFormAction}
      />,
    );

    const form = container.querySelector('form');
    expect(form).not.toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fakeFormData = new FormData(form!);
    mockFormAction(fakeFormData);

    expect(mockFormAction).toHaveBeenCalledTimes(1);
    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));
  });
});
