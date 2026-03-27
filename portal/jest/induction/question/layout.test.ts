import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import * as navigation from 'next/navigation';
import { createElement } from 'react';

import { isValidQuestionNumber } from '@/app/induction/question/[question_number]/_components/questionHelper';
import QuestionPageLayout from '@/app/induction/question/[question_number]/layout';
import * as agreementsModule from '@/services/getUserAgreements';

jest.mock('services/getUserAgreements');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));
jest.mock('app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn(async () => ({
    user: { email: 'test@user.com' },
  })),
}));
jest.mock(
  'app/induction/question/[question_number]/_components/questionHelper',
  () => ({
    isValidQuestionNumber: jest.fn(),
  }),
);

describe('QuestionPageLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to / if inductionNeeded is false', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: false,
      inductionPassed: false,
    });

    const children = createElement('div', null, 'Child');
    const params = { question_number: '1' };

    await QuestionPageLayout({ children, params });

    expect(navigation.redirect).toHaveBeenCalledWith('/');
  });

  it('redirects to / if inductionPassed is true', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: true,
    });

    const children = createElement('div', null, 'Child');
    const params = { question_number: '1' };

    await QuestionPageLayout({ children, params });

    expect(navigation.redirect).toHaveBeenCalledWith('/');
  });

  it('redirects to / if inductionNeeded is false', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: false,
      inductionPassed: false,
    });

    const children = createElement('div', null, 'Child');
    const params = { question_number: '1' };

    await QuestionPageLayout({ children, params });

    expect(navigation.redirect).toHaveBeenCalledWith('/');
  });

  it('renders children if question number is valid and induction needed and not passed', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: false,
    });

    (isValidQuestionNumber as jest.Mock).mockReturnValue(true);

    const children = createElement('div', null, 'Valid Question');
    const params = { question_number: '1' };

    const result = await QuestionPageLayout({ children, params });

    const { findByText } = render(result as JSX.Element);
    expect(await findByText('Valid Question')).toBeInTheDocument();
    expect(navigation.redirect).not.toHaveBeenCalled();
    expect(navigation.notFound).not.toHaveBeenCalled();
  });

  it('calls notFound if question number is invalid', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: false,
    });
    (isValidQuestionNumber as jest.Mock).mockReturnValue(false);

    const children = createElement('div', null, 'Invalid Question');
    const params = { question_number: '0' };

    await QuestionPageLayout({ children, params });

    expect(navigation.notFound).toHaveBeenCalled();
  });
});
