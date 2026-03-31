import {
  MULTIPLE_CHOICE_KEY,
  QUESTIONS_ARRAY,
} from '@/app/induction/question/[question_number]/_components/consts';

import {
  describe_only_if_induction_flag_enabled,
  inductionQuestionPageUrl,
  inductionStartPageUrl,
  navigateToPageAndConfirmLoad,
  QA01_ID,
  setTestInductionCookie,
  user_analyst_c,
} from '../utils';

export {};

beforeEach(() => {
  cy.task('updateUserInductionStatus', {
    user_email: user_analyst_c.email,
    done_induction: false,
  });
});

after(() => {
  cy.task('updateUserInductionStatus', {
    user_email: user_analyst_c.email,
    done_induction: true,
  });
});

describe_only_if_induction_flag_enabled('Induction flow test', () => {
  beforeEach(() => {
    cy.visit('/'); // must visit a page first
    setTestInductionCookie({}, [], false, 'ANALYST');
    cy.full_login('ANALYST');
  });

  it('E2E induction flow', () => {
    //---------------------------------------------------------------------------------------------
    cy.log('User redirected to induction start if not passed induction');
    //---------------------------------------------------------------------------------------------
    navigateToPageAndConfirmLoad('/', '[data-cy="induction-start-page"]');

    //---------------------------------------------------------------------------------------------
    cy.log('Start page is accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    cy.get('[data-cy="continue-button"]').contains('Continue').click();
    cy.get('[data-cy="question-number"]')
      .contains('Question 1')
      .should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Single Key question pages are accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    //---------------------------------------------------------------------------------------------
    cy.log('Continue on single choice without selecting answer shows error');
    //---------------------------------------------------------------------------------------------
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="question-number"]')
      .contains('Question 1')
      .should('exist');
    cy.get('#error-summary-title').should('exist');
    cy.get('#error-summary-list').should('exist');

    selectQuestionCorrectAnswerAndContinue('1');
    selectQuestionCorrectAnswerAndContinue('2');
    selectQuestionCorrectAnswerAndContinue('3');
    selectQuestionCorrectAnswerAndContinue('4');
    selectQuestionCorrectAnswerAndContinue('5');
    selectQuestionCorrectAnswerAndContinue('6', true);

    //---------------------------------------------------------------------------------------------
    cy.log('Multiple Key question pages are accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    //---------------------------------------------------------------------------------------------
    cy.log('Continue on multiple choice without selecting answer shows error');
    //---------------------------------------------------------------------------------------------
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="question-number"]')
      .contains('Question 7')
      .should('exist');
    cy.get('#error-summary-title').should('exist');
    cy.get('#error-summary-list').should('exist');

    selectQuestionCorrectAnswerAndContinue('7', true);

    //---------------------------------------------------------------------------------------------
    cy.log('User answers persist when going back to previous questions');
    //---------------------------------------------------------------------------------------------
    cy.get(`[data-cy="go-back-link"]`).should('exist').click();
    cy.get('[data-cy="question-number"]')
      .contains(`Question 7`)
      .should('exist');
    cy.get(
      'input[type="checkbox"][value="When clear context is given"]',
    ).should('be.checked');
    cy.get(
      'input[type="checkbox"][value="Counts under 10 are suppressed and all counts greater than 10 are rounded to the nearest 5"]',
    ).should('be.checked');
    cy.get(
      'input[type="checkbox"][value="Analytical results that you would expect to see in the public domain"]',
    ).should('be.checked');
    cy.get(
      'input[type="checkbox"][value="The output is unreasonably long"]',
    ).should('not.be.checked');
    cy.get(
      'input[type="checkbox"][value="The output contains personally identifiable information',
    ).should('not.be.checked');
    cy.get(
      'input[type="checkbox"][value="There is undeclared data in a code output',
    ).should('not.be.checked');
    cy.get(`[data-cy="go-back-link"]`).should('exist').click();
    cy.contains('.nhsuk-radios__item', 'Clinical codelist of SNOMED codes')
      .find('input[type="radio"]')
      .should('be.checked');
    cy.contains('.nhsuk-radios__item', 'A list of names and addresses')
      .find('input[type="radio"]')
      .should('not.be.checked');
    cy.contains('.nhsuk-radios__item', 'Patient level data in a csv file')
      .find('input[type="radio"]')
      .should('not.be.checked');

    //---------------------------------------------------------------------------------------------
    cy.log('Page Not Found displayed if out of range question number in URL');
    //---------------------------------------------------------------------------------------------
    cy.visit(inductionQuestionPageUrl(`${QUESTIONS_ARRAY.length + 3}`), {
      failOnStatusCode: false,
    });
    cy.get('[data-cy="not-found-page"]').should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Check Not Found page is accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    //---------------------------------------------------------------------------------------------
    cy.log('Go back link navigates to induction start page');
    //---------------------------------------------------------------------------------------------

    cy.get('[data-cy="go-back-link"]').click();
    cy.get('h1').contains('Complete the induction assessment').should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Page Not Found displayed if decimal question number in URL');
    //---------------------------------------------------------------------------------------------
    cy.visit(inductionQuestionPageUrl(`${QUESTIONS_ARRAY.length + 0.5}`), {
      failOnStatusCode: false,
    });
    cy.get('[data-cy="not-found-page"]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy="go-back-link"]').click();
      });
    cy.get('h1').contains('Complete the induction assessment').should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Page Not Found displayed if non-int question number in URL');
    //---------------------------------------------------------------------------------------------
    cy.visit(inductionQuestionPageUrl('What is the Matrix?'), {
      failOnStatusCode: false,
    });
    cy.get('[data-cy="not-found-page"]').should('be.visible');

    cy.visit(inductionStartPageUrl());
    cy.contains('Continue').click();
    cy.get('[data-cy="question-number"]')
      .contains('Question 8')
      .should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Incorrect question answers result in assessment not passed');
    //---------------------------------------------------------------------------------------------
    selectQuestionIncorrectAnswerAndContinue('8');
    selectQuestionIncorrectAnswerAndContinue('9');
    selectQuestionIncorrectAnswerAndContinue('10');
    cy.get('h1').contains('Assessment not passed').should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Not-passed page is accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    //---------------------------------------------------------------------------------------------
    cy.log('Retake button navigates to first incorrect question');
    //---------------------------------------------------------------------------------------------
    cy.get('[data-cy="retake-button"]').should('exist').click();
    cy.get('[data-cy="question-number"]')
      .contains('Question 8')
      .should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('User prevented from going back to a correctly answered question');
    //---------------------------------------------------------------------------------------------
    navigateToPageAndConfirmLoad(
      '/induction/question/2',
      '[data-cy="induction-question-8"]',
    );

    //---------------------------------------------------------------------------------------------
    cy.log('Answering all questions correctly results in passed page');
    //---------------------------------------------------------------------------------------------
    selectQuestionCorrectAnswerAndContinue('8');
    selectQuestionCorrectAnswerAndContinue('9');
    selectQuestionCorrectAnswerAndContinue('10');
    cy.get('h1').contains('Assessment passed').should('exist');

    //---------------------------------------------------------------------------------------------
    cy.log('Check passed page is accessible');
    //---------------------------------------------------------------------------------------------
    cy.checkAccessibility('main');

    //---------------------------------------------------------------------------------------------
    cy.log('Go to SDE Portal button navigates to SDE portal');
    //---------------------------------------------------------------------------------------------
    cy.get('a').contains('Go to SDE Portal').click();
    cy.get('[data-cy="select-agreement-page"]').should('be.visible');

    //---------------------------------------------------------------------------------------------
    cy.log('User who completed induction gets redirected away from induction');
    //---------------------------------------------------------------------------------------------
    navigateToPageAndConfirmLoad(
      '/induction',
      '[data-cy="select-agreement-page"]',
    );
    //---------------------------------------------------------------------------------------------
    cy.log('Correct options are displayed for analyst user');
    //---------------------------------------------------------------------------------------------
    cy.get(`#agreement_selector-${QA01_ID}`).should('exist').click();
    cy.get('[data-cy=manage-users-card').should('not.exist');
    cy.get('[data-cy=launch-virtual-desktop-card').should('exist');
    cy.get('[data-cy=upload-ref-data-card]').should('exist');
    cy.get('[data-cy=help-card]').should('exist');
  });
});

function selectQuestionIncorrectAnswerAndContinue(
  question_number: string,
  validate_on_next_question_page = true,
) {
  const question_array_index = parseInt(question_number) - 1;
  const question = QUESTIONS_ARRAY[question_array_index];

  question.options.forEach((option) => {
    if (!question.answers.includes(option)) {
      cy.get(`input[value="${option}"]`).click();
    }
  });

  if (
    question.type === MULTIPLE_CHOICE_KEY &&
    question.answers.length === question.options.length
  ) {
    cy.get(`input[value="${question.options[1]}"]`).click();
  }

  if (question_array_index === QUESTIONS_ARRAY.length - 1)
    cy.get('button').contains('Submit Answers').click();
  else {
    cy.get('button').contains('Continue').click();
    if (validate_on_next_question_page) {
      cy.get('span')
        .contains(`Question ${parseInt(question_number) + 1}`)
        .should('exist');
    }
  }
}

function selectQuestionCorrectAnswerAndContinue(
  question_number: string,
  validate_on_next_question_page = true,
) {
  const question_array_index = parseInt(question_number) - 1;

  QUESTIONS_ARRAY[question_array_index].answers.forEach((answer) => {
    cy.get(`input[value="${answer}"]`).click();
  });

  if (question_array_index === QUESTIONS_ARRAY.length - 1)
    cy.get('button').contains('Submit Answers').click();
  else {
    cy.get('button').contains('Continue').click();
    if (validate_on_next_question_page) {
      cy.get('span')
        .contains(`Question ${parseInt(question_number) + 1}`)
        .should('exist');
    }
  }
}
