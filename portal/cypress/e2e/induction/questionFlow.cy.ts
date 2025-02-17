import { QUESTIONS_ARRAY } from "app/induction/question/[question_number]/consts";
import { INDUCTION_COOKIE_NAME } from "app/induction/consts";
import {
  inductionQuestionPageUrl,
  describe_only_if_induction_flag_enabled,
  inductionStartPageUrl,
  inductionNotPassedPageUrl,
  setTestInductionCookie,
  user_analyst_c,
} from "../utils";

// Every E2E test file needs this, or else retries pass when they should fail
beforeEach(() => {
  cy.task("updateUserInductionStatus", {
    user_email: user_analyst_c.email,
    done_induction: false,
  });
});

describe_only_if_induction_flag_enabled("Induction start page tests", () => {
  beforeEach(() => {
    cy.full_login("ANALYST");
  });

  it("has expected components", () => {
    cy.visit(inductionStartPageUrl());
    cy.get("h1").contains("Complete the induction assessment");
    cy.contains("You can retake this assessment as many times as you need to");
    cy.get("a").contains("Continue").click();
    cy.url().should(
      "equal",
      Cypress.config("baseUrl") + "/induction/question/1"
    );
  });

  it("Start button should jump to next uncompleted question if already part completed induction", () => {
    // start quiz and answer first question
    cy.visit(inductionStartPageUrl());
    cy.get("h1").contains("Complete the induction assessment");
    cy.get("a").contains("Continue").click();
    cy.url().should(
      "equal",
      Cypress.config("baseUrl") + "/induction/question/1"
    );
    selectQuestionCorrectAnswerAndContinue("1");
    cy.url().should(
      "equal",
      Cypress.config("baseUrl") + "/induction/question/2"
    );

    // go back to start page, click continue and should now be on Q2
    cy.visit(inductionStartPageUrl());
    cy.get("h1").contains("Complete the induction assessment");
    cy.get("a").contains("Continue").click();
    cy.url().should(
      "equal",
      Cypress.config("baseUrl") + "/induction/question/2"
    );
  });
});

describe_only_if_induction_flag_enabled("Induction question page tests", () => {
  beforeEach(() => {
    cy.full_login("ANALYST");
  });

  function checkCommonComponents(question_number: string) {
    cy.visit(inductionQuestionPageUrl(question_number));
    cy.get("span").contains(`Question ${question_number}`).should("exist");
    cy.get("button").contains("Continue");
  }
  function inputShould(
    should: string,
    type: string,
    name: string,
    value: string
  ) {
    cy.get(`input[name="${name}"][value="${value}"][type="${type}"]`).should(
      should
    );
  }
  it("Question page contains correct information for single answer question page", () => {
    const question_number = "1";
    const question_array_index = parseInt(question_number) - 1;
    // verify components found on all pages exist
    checkCommonComponents(question_number);
    // question 1 should not contain go back link
    cy.get(`[data-cy="go-back-link"]`).should("not.exist");
    // single answer page specific components
    QUESTIONS_ARRAY[question_array_index].options.forEach((option_text) => {
      inputShould("exist", "radio", `question_${question_number}`, option_text);
    });
  });
  it("Question page contains correct information for multi answer question page", () => {
    const question_number = "7";
    const question_array_index = parseInt(question_number) - 1;

    setTestInductionCookie({
      "1": [4],
      "2": [0],
      "3": [0],
      "4": [0],
      "5": [1],
      "6": [1],
    });
    // verify components found on all pages exist
    checkCommonComponents(question_number);
    // multi answer page specific components
    cy.get("span").contains("Select all that apply.");
    QUESTIONS_ARRAY[question_array_index].options.forEach((option_text) => {
      inputShould(
        "exist",
        "checkbox",
        `question_${question_number}`,
        option_text
      );
    });
  });
  it("Selecting next redirects to earliest unanswered question", () => {
    //cookie is checked and user is directed to earliest unanswered question
    //e.g. if the cookie does not contain an answer for question 3 but the user is on question 5, when the user hits next the user should be redirected to question 3
    const question_number = "8";

    setTestInductionCookie({
      "1": [1],
      "2": [4],
      "4": [0],
      "5": [1],
      "6": [1],
    });
    cy.visit(inductionQuestionPageUrl(question_number));
    cy.get("span").contains(`Question 3`).should("exist");
  });
  it("User answers persist when they go back to previous question", () => {
    const question_number = "1";
    cy.visit(inductionQuestionPageUrl(question_number));
    selectQuestionCorrectAnswerAndContinue("1");
    selectQuestionCorrectAnswerAndContinue("2");
    selectQuestionCorrectAnswerAndContinue("3");
    cy.visit(inductionQuestionPageUrl(question_number));
    cy.get('input[type="radio"][value="The Secure Data Environment"]').should(
      "be.checked"
    );
  });
  it("Back Link works correctly", () => {
    const question_number = "1";
    cy.visit(inductionQuestionPageUrl(question_number));
    selectQuestionCorrectAnswerAndContinue(question_number);
    cy.contains("a", "Go back")
      .should("be.visible")
      .and("have.attr", "href", "/induction/question/1");
    cy.contains("a", "Go back").click();
    cy.url().should("include", "/induction/question/1");
    cy.get("span").contains(`Question 1`).should("exist");
  });
  it("Correctly answer all questions takes you to end of quiz", () => {
    // Start induction
    cy.visit(inductionStartPageUrl());
    cy.get("a").contains("Continue").click();

    // Correctly answer each question in turn
    for (let index = 0; index < QUESTIONS_ARRAY.length; index++) {
      const question_number = (index + 1).toString();
      cy.get("span").contains(`Question ${question_number}`).should("exist");
      selectQuestionCorrectAnswerAndContinue(question_number);
    }
    cy.url().should("equal", Cypress.config("baseUrl") + "/induction/passed");

    // check page looks as expected
    cy.get("h1").contains("Assessment passed").should("exist");
    cy.get("h2").contains("What happens next").should("exist");
    cy.get("p").contains("Your account has been activated").should("exist");
    cy.get("a").contains("What did you think of the induction").should("exist");
    cy.get("a").contains("Go to SDE Portal").click();
    cy.url().should("eq", Cypress.config("baseUrl") + "/");
  });
  it("Incorrect answers all questions takes you to end of quiz", () => {
    // Start induction
    cy.visit(inductionStartPageUrl());
    cy.get("a").contains("Continue").click();

    // Answer even questions correctly and odd questions incorrectly
    for (let index = 0; index < QUESTIONS_ARRAY.length; index++) {
      const question_number = (index + 1).toString();
      cy.get("span").contains(`Question ${question_number}`).should("exist");
      if (index % 2 === 0)
        selectQuestionIncorrectAnswerAndContinue(question_number);
      else selectQuestionCorrectAnswerAndContinue(question_number);
    }

    // should go to not passed page
    cy.url().should(
      "equal",
      Cypress.config("baseUrl") + "/induction/not-passed"
    );

    // check page rendered as expected
    cy.get("h1").contains("Assessment not passed").should("exist");
    cy.get("p")
      .contains("You will need to retake the following")
      .should("exist");
    QUESTIONS_ARRAY.forEach((question, index) => {
      const question_number = (index + 1).toString();
      if ((index + 1) % 2 !== 0)
        cy.get("dt").contains(`Question ${question_number}`).should("exist");
    });
  });
  it("Displays not found page if question number is not int or outside of array bounds", () => {
    const page_not_found_header = "Page not found";
    // array index is out of bounds so expect failure
    let question_array_index = QUESTIONS_ARRAY.length + 1;
    let question_number = question_array_index.toString();
    cy.visit(inductionQuestionPageUrl(question_number), {
      failOnStatusCode: false,
    });
    cy.get("h1").contains(page_not_found_header).should("exist");

    // decimal so expect failure
    question_number = "1.5";
    cy.visit(inductionQuestionPageUrl(question_number), {
      failOnStatusCode: false,
    });
    cy.get("h1").contains(page_not_found_header).should("exist");

    // chars so expect failure
    question_number = "What is the Matrix?";
    cy.visit(inductionQuestionPageUrl(question_number), {
      failOnStatusCode: false,
    });
    cy.get("h1").contains(page_not_found_header).should("exist");
  });
  it("Clicking continue without selecting option shows an error", () => {
    // No inputs on single input answer question displays correct errors
    let question_number = "1";
    cy.visit(inductionQuestionPageUrl(question_number));
    cy.get("span").contains(`Question ${question_number}`).should("exist");
    cy.get("button").contains("Continue").click();
    cy.get("a")
      .contains("You must select an option to continue")
      .should("exist");
    cy.get("span")
      .contains("You must select an option to continue")
      .should("exist");

    // Correctly answer each question in turn until we reach multiple choice q
    for (let index = 0; index < 6; index++) {
      const question_number = (index + 1).toString();
      cy.get("span").contains(`Question ${question_number}`).should("exist");
      selectQuestionCorrectAnswerAndContinue(question_number);
    }

    // Multple choice question displays different error messages
    question_number = "7";
    cy.get("span").contains(`Question ${question_number}`).should("exist");
    cy.get("button").contains("Continue").click();
    cy.get("a")
      .contains("You must select at least one option to continue")
      .should("exist");
    cy.get("span")
      .contains("You must select at least one option to continue")
      .should("exist");
  });
  it("Cookies are user specific", () => {
    // set a preexisting cookie for a different user with wrong asnwers 3,4,5,6
    // if we were to log into correct user should go directly to q3
    setTestInductionCookie({}, [3, 4, 5, 6], false, "USER_MANAGER");

    // Trying to go to one of these incorrectly asnwered questions should let us load the page if same user
    // but because we're logged in as different user now, it redirects us back to Q1
    cy.visit(inductionQuestionPageUrl("5"));
    cy.get("span").contains(`Question 1`).should("exist");
  });
});

describe_only_if_induction_flag_enabled(
  "Induction question page - wrong answer flow",
  () => {
    beforeEach(() => {
      cy.clearAllCookies();
      cy.full_login("ANALYST");
    });

    it("User is directed to earliest wrong question", () => {
      setTestInductionCookie({}, [3, 7]);
      // from not passed page
      cy.visit(inductionNotPassedPageUrl());
      cy.get("h1").contains("Assessment not passed").should("exist");
      cy.get("a").contains("Retake these questions").click();
      cy.url().should("include", "/induction/question/3");

      // from induction start page
      cy.visit(inductionStartPageUrl());
      cy.get("h1").contains("Complete the induction assessment");
      cy.get("a").contains("Continue").click();
      cy.url().should("include", "/induction/question/3");

      // trying to go to a question that is not in the wrong array
      cy.visit(inductionStartPageUrl());
      cy.get("h1").contains("Complete the induction assessment");
      cy.get("a").contains("Continue").click();
      cy.visit(inductionQuestionPageUrl("1"));
      cy.get("span").contains(`Question 3`).should("exist");
    });
    it("Navigation between wrong questions works correctly", () => {
      setTestInductionCookie({}, [3, 7]);

      // start at first question in wrong array
      cy.visit(inductionQuestionPageUrl("3"));
      cy.get("span").contains(`Question 3`).should("exist");
      cy.get("a").contains("Go back").should("not.exist");
      selectQuestionCorrectAnswerAndContinue("3", false);

      cy.get("span").contains(`Question 7`).should("exist");
      cy.get("a").contains("Go back").click();
      cy.get("span").contains(`Question 3`).should("exist");
    });
    it("Marking only wrong answers", () => {
      setTestInductionCookie({}, [3, 7]);

      // incorrectly answer question 3 and correctly answer question 7
      cy.visit(inductionQuestionPageUrl("3"));
      cy.get("span").contains(`Question 3`).should("exist");
      selectQuestionIncorrectAnswerAndContinue("3", false);

      cy.get("span").contains(`Question 7`).should("exist");
      let question_array_index = 6;
      QUESTIONS_ARRAY[question_array_index].answers.forEach((answer) => {
        cy.get(`input[value="${answer}"]`).click();
      });
      cy.get("button").contains("Submit Answers").click();

      // should go to not passed page and should contain q3
      cy.url().should(
        "equal",
        Cypress.config("baseUrl") + "/induction/not-passed"
      );
      cy.get("dt").contains(`Question 3`).should("exist");

      // retake questions and answer them correctly
      cy.get("a").contains("Retake these questions").click();
      cy.get("span").contains(`Question 3`).should("exist");
      question_array_index = 2;
      QUESTIONS_ARRAY[question_array_index].answers.forEach((answer) => {
        cy.get(`input[value="${answer}"]`).click();
      });
      cy.get("button").contains("Submit Answers").click();

      cy.url().should("equal", Cypress.config("baseUrl") + "/induction/passed");
    });
  }
);

function selectQuestionCorrectAnswerAndContinue(
  question_number: string,
  validate_on_next_question_page: boolean = true
) {
  const question_array_index = parseInt(question_number) - 1;

  QUESTIONS_ARRAY[question_array_index].answers.forEach((answer) => {
    cy.get(`input[value="${answer}"]`).click();
  });

  if (question_array_index === QUESTIONS_ARRAY.length - 1)
    cy.get("button").contains("Submit Answers").click();
  else {
    cy.get("button").contains("Continue").click();
    if (validate_on_next_question_page) {
      cy.get("span")
        .contains(`Question ${parseInt(question_number) + 1}`)
        .should("exist");
    }
  }
}
function selectQuestionIncorrectAnswerAndContinue(
  question_number: string,
  validate_on_next_question_page: boolean = true
) {
  const question_array_index = parseInt(question_number) - 1;

  QUESTIONS_ARRAY[question_array_index].options.forEach((option) => {
    if (!QUESTIONS_ARRAY[question_array_index].answers.includes(option)) {
      cy.get(`input[value="${option}"]`).click();
    }
  });

  if (question_array_index === QUESTIONS_ARRAY.length - 1)
    cy.get("button").contains("Submit Answers").click();
  else {
    cy.get("button").contains("Continue").click();
    if (validate_on_next_question_page) {
      cy.get("span")
        .contains(`Question ${parseInt(question_number) + 1}`)
        .should("exist");
    }
  }
}

export {};
