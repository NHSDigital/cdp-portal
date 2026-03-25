import { render } from '@testing-library/react';
import * as navigation from 'next/navigation';

import {
  MULTIPLE_CHOICE_KEY,
  Question,
  SINGLE_CHOICE_KEY,
} from '@/app/induction/question/[question_number]/_components/consts';
import { goToFirstUnansweredQuestion } from '@/app/induction/question/[question_number]/_components/questionHelper';
import {
  getBackLinkPath,
  isValidQuestionNumber,
  QuestionInputs,
} from '@/app/induction/question/[question_number]/_components/questionHelper';
import * as formFields from '@/app/shared/formFields';
import { queryAllByDataCy } from '@/jest/utils';

jest.mock('@/app/shared/formFields', () => ({
  RadioButtonInputField: jest.fn(() => <div data-cy='test-radio' />),
  CheckboxInputField: jest.fn(() => <div data-cy='test-checkbox' />),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('getBackLinkPath tests', () => {
  it('returns undefined if current_question_number is 1', () => {
    expect(
      getBackLinkPath({ current_question_number: 1, cookie_wrong: [] }),
    ).toBeUndefined();
  });

  it('returns undefined if no previous question in cookie_wrong list', () => {
    expect(
      getBackLinkPath({ current_question_number: 3, cookie_wrong: [3, 5] }),
    ).toBeUndefined();
  });

  it('returns undefined if current question is not in cookie_wrong list', () => {
    expect(
      getBackLinkPath({ current_question_number: 4, cookie_wrong: [2, 5, 6] }),
    ).toBeUndefined();
  });

  it('returns previous question number from cookie_wrong where available', () => {
    expect(
      getBackLinkPath({ current_question_number: 3, cookie_wrong: [2, 3, 4] }),
    ).toBe('/induction/question/2');
  });

  it('returns previous in sequence if cookie_wrong is empty', () => {
    expect(
      getBackLinkPath({ current_question_number: 4, cookie_wrong: [] }),
    ).toBe('/induction/question/3');
  });

  it('returns undefined if current question is the first in cookie_wrong list', () => {
    expect(
      getBackLinkPath({ current_question_number: 2, cookie_wrong: [2, 3, 4] }),
    ).toBeUndefined();
  });
});

describe('isValidQuestion tests', () => {
  it('returns true if question number is valid', () => {
    expect(isValidQuestionNumber('2')).toBe(true);
  });

  it('returns false if question number is negative', () => {
    expect(isValidQuestionNumber('-2')).toBe(false);
  });

  it('returns false if question number is 0', () => {
    expect(isValidQuestionNumber('0')).toBe(false);
  });

  it('returns false if question number is out of range', () => {
    expect(isValidQuestionNumber('11')).toBe(false);
  });
});

describe('QuestionInputs tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const defaultProps: {
    type: Question['type'];
    input_group: string;
    options: string[];
    saved_question: number[];
    error_ids?: string[];
  } = {
    type: 'SINGLE_CHOICE',
    input_group: 'question_1',
    options: ['Option 1', 'Option 2', 'Option 3'],
    saved_question: [2],
    error_ids: undefined,
  };

  it('calls RadioButtonInputField component for SINGLE_CHOICE_KEY with correct input', () => {
    render(<QuestionInputs {...defaultProps} />);

    expect(queryAllByDataCy('test-radio')).toHaveLength(3);

    const calls = (formFields.RadioButtonInputField as jest.Mock).mock.calls;
    expect(calls).toHaveLength(3);

    calls.forEach((callArgs, index) => {
      const props = callArgs[0];

      expect(props).toMatchObject({
        label: defaultProps.options[index],
        button_value: defaultProps.options[index],
        button_group: defaultProps.input_group,
        default_checked: index === 2,
        error_ids: undefined,
      });
    });
  });

  it('calls CheckboxInputField components for MULTIPLE_CHOICE_KEY with correct input', () => {
    const options = ['Option A', 'Option B', 'Option C'];
    const saved_question = [1];
    render(
      <>
        {QuestionInputs({
          type: MULTIPLE_CHOICE_KEY,
          input_group: 'question_2',
          options: options,
          saved_question: saved_question,
          error_ids: ['error-2'],
        })}
      </>,
    );

    expect(queryAllByDataCy('test-checkbox')).toHaveLength(3);

    const calls = (formFields.CheckboxInputField as jest.Mock).mock.calls;
    expect(calls).toHaveLength(3);

    calls.forEach((callArgs, index) => {
      const props = callArgs[0];

      expect(props).toMatchObject({
        label: options[index],
        button_value: options[index],
        button_group: 'question_2',
        default_checked: index === 1,
        error_ids: ['error-2'],
      });
    });
  });

  it('handles missing error_ids gracefully', () => {
    render(
      <>
        {QuestionInputs({
          type: SINGLE_CHOICE_KEY,
          input_group: 'question_3',
          options: ['Option A', 'Option B', 'Option C'],
          saved_question: [],
          error_ids: undefined,
        })}
      </>,
    );

    const inputs = queryAllByDataCy('test-radio');
    expect(inputs).toHaveLength(3);
    inputs.forEach((input) => {
      expect(input).not.toHaveAttribute('error_ids');
    });
  });

  it('returns undefined for unknown question type in QuestionInputs', () => {
    const result = QuestionInputs({
      // @ts-expect-error: testing fallback for unknown type
      type: 'UNKNOWN_TYPE',
      input_group: 'q',
      options: ['A', 'B'],
      saved_question: [],
    });

    expect(result).toBeUndefined();
  });
});

describe('goToFirstUnansweredQuestion tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not redirect if current question is the first unanswered incorrect question', () => {
    const answers = {
      '1': [1],
      '2': [2],
    };

    goToFirstUnansweredQuestion(1, answers, [1, 2, 3]);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('does not redirect if current question is in incorrect and unanswered', () => {
    const answers = {
      '1': [1],
      '3': [3],
    };

    goToFirstUnansweredQuestion(2, answers, [1, 2, 3]);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('does not redirect if current question is the first unanswered in full list', () => {
    const answers = {
      '1': [1],
      '2': [2],
      '3': [3],
      '4': [4],
    };

    goToFirstUnansweredQuestion(5, answers, []);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('does not redirect if all questions are answered', () => {
    const answers = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [(index + 1).toString(), [1]]),
    );

    goToFirstUnansweredQuestion(5, answers, []);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('does not redirect if current question is unanswered but all others are answered', () => {
    const answers = {
      '1': [1],
      '3': [3],
    };

    goToFirstUnansweredQuestion(2, answers, [1, 2, 3]);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('redirects to unanswered question in full list (current question answered)', () => {
    const answers = {
      '1': [1],
      '3': [3],
    };

    goToFirstUnansweredQuestion(3, answers, []);

    expect(navigation.redirect).toHaveBeenCalledWith('/induction/question/2');
  });

  it('redirects to unanswered question in incorrectQuestions (current answered)', () => {
    const answers = {
      '1': [1],
    };

    goToFirstUnansweredQuestion(1, answers, [2]);

    expect(navigation.redirect).toHaveBeenCalledWith('/induction/question/2');
  });

  it('does not redirect if only unanswered question is current', () => {
    const answers = {
      '1': [1],
      '3': [3],
    };

    goToFirstUnansweredQuestion(2, answers, [2]);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('redirects to first unanswered when no answers exist', () => {
    const answers = {};

    goToFirstUnansweredQuestion(5, answers, []);

    expect(navigation.redirect).toHaveBeenCalledWith('/induction/question/1');
  });

  it('does not redirect if current is first unanswered', () => {
    const answers = {
      '2': [1],
      '3': [1],
    };

    goToFirstUnansweredQuestion(1, answers, [1, 2, 3]);

    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});
