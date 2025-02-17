// Import commands.js using ES2015 syntax:
import "./commands";

Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("NEXT_NOT_FOUND")) {
    return false; // allow uncaught 404s, they'll redirect to the 404 page and may be intentional
  }
  if (err.message.includes("NEXT_REDIRECT")) {
    return false;
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
});
