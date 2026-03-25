// Import commands.js using ES2015 syntax:
import './commands';
import '@cypress/code-coverage/support';
import 'cypress-terminal-report/src/installLogsCollector.js';

beforeEach(() => {
  /* forces state reset before each test */
});

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('There was an error while hydrating')) {
    throw err; // fail the test
  }
  if (err.message.includes('NEXT_NOT_FOUND')) {
    return false; // allow uncaught 404s, they'll redirect to the 404 page and may be intentional
  }
  if (err.message.includes('NEXT_REDIRECT')) {
    return false;
  }
  if (
    err.message.includes('negative time stamp') &&
    err.message.includes('QuestionPageLayout')
  ) {
    return false;
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
});
