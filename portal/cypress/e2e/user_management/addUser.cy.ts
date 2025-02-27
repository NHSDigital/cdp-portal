import {
  addUserConfirmUrl,
  addUserUrl,
  describe_only_if_manage_users_flag_enabled,
  setTestAddUserFormCookie,
  user_data_wrangler_nc,
  user_support_admin_nc,
} from "../utils";

//---------------------------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users/add-user"
//---------------------------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled("add-user page tests", () => {
  it("Analyst - cannot view page", () => {
    cy.full_login("ANALYST");
    cy.visit(addUserUrl(), { failOnStatusCode: false });
    // Analyst gets the missing permission error (403)
    cy.get("h1").contains("You do not have permission to access this page");
  });

  it("UserManager - can view page", () => {
    cy.full_login("USER_MANAGER");
    cy.visit(addUserUrl(), { failOnStatusCode: false });
    // UserManager has the permission to view the page so header renders
    cy.get("h1").contains("Add a new user");
  });

  it("UserManager - can create a single user", () => {
    cy.full_login("USER_MANAGER");
    cy.visit(addUserUrl());
    // Go to  filled out confirm page
    setTestAddUserFormCookie("Bob", "Ross", "bob.ross@example.com", "Analyst");
    cy.visit(addUserConfirmUrl());
    cy.url().should("include", "/add-user/confirm");
    cy.get("h1")
      .contains("Confirm user details", { timeout: 15 * 2000 })
      .should("exist");
    // Should redirect to the confirm page and the page should contain the user details
    // check the confirm user details page appears correct
    cy.get("table td:nth-child(1)").contains("Bob").should("exist");
    cy.get("table td:nth-child(2)").contains("Ross").should("exist");
    cy.get("table td:nth-child(3)")
      .contains("bob.ross@example.com")
      .should("exist");
    cy.get("table td:nth-child(4)").contains("Analyst").should("exist");
    // Clicking the final confirm button should attempt to add the user and redirect to the manage users page
    cy.get('input[name="final_confirm"]').click({ force: true });

    // press confirm and wait for response
    cy.get("button").contains("Confirm users").click();
    cy.get("h1", { timeout: 15 * 2000 })
      .contains("Manage users", { timeout: 15 * 2000 })
      .should("exist");
    // The manage users page should contains some text indicating the user was added successfully
    cy.get("p span").contains("Bob Ross added successfully");
  });

  it("Back button - returns to previous page", () => {
    cy.full_login("USER_MANAGER");
    cy.visit(addUserUrl());

    // back button should redirect to the manage users page
    cy.get("a").contains("Go back").click();
    cy.get("h1").contains("Manage users").should("exist");

    // go back to add user page
    setTestAddUserFormCookie("Bob", "Ross", "bob.ross@example.com", "Analyst");
    cy.visit(addUserConfirmUrl());
    cy.url().should("include", "/add-user/confirm");
    cy.get("h1")
      .contains("Confirm user details", { timeout: 15 * 2000 })
      .should("exist");

    // going to add user form via add new user and pressing back should return to confirm page
    cy.get("a").contains("Add another user").click();
    cy.get("h1").contains("Add a new user").should("exist");
    cy.get("a").contains("Go back").click();
    cy.get("h1").contains("Confirm user details").should("exist");

    // going to add user form via edit and pressing back should return to confirm page
    cy.get("a").contains("Edit").click();
    cy.get("h1").contains("Add a new user").should("exist");
    cy.get("a").contains("Go back").click();
    cy.get("h1").contains("Confirm user details").should("exist");
  });

  it("Cannot use a user email if they are already a data wrangler or support admin", () => {
    cy.full_login("USER_MANAGER");

    // try using email of data wrangler
    // go back to add user page
    setTestAddUserFormCookie(
      "FakeFirstName",
      "FakeLastName",
      user_data_wrangler_nc.email,
      "Analyst"
    );
    cy.visit(addUserConfirmUrl());
    cy.url().should("include", "/add-user/confirm");
    cy.get("h1")
      .contains("Confirm user details", { timeout: 15 * 2000 })
      .should("exist");
    cy.get('input[name="final_confirm"]').click({ force: true });
    cy.get("button").contains("Confirm users").click();
    cy.get("h1", { timeout: 15 * 2000 })
      .contains("Sorry, there is a problem with the service", {
        timeout: 15 * 2000,
      })
      .should("exist");

    // try using email of support admin
    setTestAddUserFormCookie(
      "FakeFirstName",
      "FakeLastName",
      user_support_admin_nc.email,
      "Analyst"
    );
    cy.visit(addUserConfirmUrl());
    cy.url().should("include", "/add-user/confirm");
    cy.get("h1")
      .contains("Confirm user details", { timeout: 15 * 2000 })
      .should("exist");
    cy.get('input[name="final_confirm"]').click({ force: true });
    cy.get("button").contains("Confirm users").click();
    cy.get("h1", { timeout: 15 * 2000 })
      .contains("Sorry, there is a problem with the service", {
        timeout: 15 * 2000,
      })
      .should("exist");
  });
});

describe_only_if_manage_users_flag_enabled(
  "adding multiple users tests",
  () => {
    it("UserManager - can add multiple users", () => {
      Cypress.Cookies.debug(true);
      cy.full_login("USER_MANAGER");
      cy.clearCookie("add_user_form");

      // add first user and navigate to page
      setTestAddUserFormCookie(
        "Bob",
        "Ross",
        "bob.ross@example.com",
        "Analyst"
      );
      cy.visit(addUserConfirmUrl());
      cy.url().should("include", "/add-user/confirm");
      cy.get("h1")
        .contains("Confirm user details", { timeout: 15 * 2000 })
        .should("exist");

      // go back to add user form
      cy.get("a").contains("Add another user").click();

      // add second user with different user id
      setTestAddUserFormCookie(
        "Nelly",
        "Rose",
        "nel.rose@example.com",
        "UserManager",
        "777777"
      );
      cy.visit(addUserConfirmUrl());
      cy.url().should("include", "/add-user/confirm");
      cy.get("h1")
        .contains("Confirm user details", { timeout: 15 * 2000 })
        .should("exist");

      // validate page
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(1)").contains("Bob").should("exist");
      cy.get("table td:nth-child(2)").contains("Ross").should("exist");
      cy.get("table td:nth-child(3)")
        .contains("bob.ross@example.com")
        .should("exist");
      cy.get("table td:nth-child(4)").contains("Analyst").should("exist");
      cy.get("table td:nth-child(1)").contains("Nelly").should("exist");
      cy.get("table td:nth-child(2)").contains("Rose").should("exist");
      cy.get("table td:nth-child(3)")
        .contains("nel.rose@example.com")
        .should("exist");
      cy.get("table td:nth-child(4)").contains("User Manager").should("exist");

      // Clicking the final confirm button should attempt to add the users and redirect to the manage users page
      cy.get('input[name="final_confirm"]').click({ force: true });
      // press confirm and wait for response
      cy.get("button").contains("Confirm users").click();
      cy.get("h1", { timeout: 15 * 2000 })
        .contains("Manage users", { timeout: 15 * 2000 })
        .should("exist");
      // The manage users page should contains some text indicating the user was added successfully
      cy.get("p span").contains("2 users added successfully");
    });

    it("Delete Button - returns to manage users if only one user", () => {
      cy.full_login("USER_MANAGER");
      cy.visit(addUserUrl());
      cy.clearCookie("add_user_form");
      // initialise user details
      const user_1 = {
        first_name: "Marcus",
        last_name: "Decimus Meridius",
        email: "marcusdecimusmeridius@example.com",
        role: "Analyst",
      };

      // add first user
      cy.get('input[name="first_name"]').type(user_1.first_name);
      cy.get('input[name="last_name"]').type(user_1.last_name);
      cy.get('input[name="email"]').type(user_1.email);
      cy.get('input[name="email_confirm"]').type(user_1.email);
      cy.get(`input[name="role"][value="${user_1.role}"]`).click();

      cy.get("button").contains("Continue").click();

      // validate user is on the page
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(3)").contains(user_1.email).should("exist");

      // deleting user should return to manage users page
      cy.contains("tr", user_1.email).find("a").contains("Delete").click();
      cy.get("h1")
        .contains(`Delete ${user_1.first_name} ${user_1.last_name}`)
        .should("exist");
      cy.get('input[name="confirm"][value="yes"]').click();
      cy.get("button").contains("Continue").click();
      cy.url().should("not.include", "/add-user/confirm");
    });

    it("Delete Button - removes users from table if multiple", () => {
      cy.full_login("USER_MANAGER");
      cy.visit(addUserUrl());
      cy.clearCookie("add_user_form");
      // initialise user details
      const user_1 = {
        first_name: "Marcus",
        last_name: "Decimus Meridius",
        email: "marcusdecimusmeridius@example.com",
        role: "Analyst",
      };
      const user_2 = {
        first_name: "Luke",
        last_name: "Skywalker",
        email: "lukeskywalker@example.com",
        role: "UserManager",
      };

      // add first user
      cy.get('input[name="first_name"]').type(user_1.first_name);
      cy.get('input[name="last_name"]').type(user_1.last_name);
      cy.get('input[name="email"]').type(user_1.email);
      cy.get('input[name="email_confirm"]').type(user_1.email);
      cy.get(`input[name="role"][value="${user_1.role}"]`).click();

      cy.get("button").contains("Continue").click();

      // go back to add user form
      cy.get("a").contains("Add another user").click();

      // add second user
      cy.get('input[name="first_name"]').type(user_2.first_name);
      cy.get('input[name="last_name"]').type(user_2.last_name);
      cy.get('input[name="email"]').type(user_2.email);
      cy.get('input[name="email_confirm"]').type(user_2.email);
      cy.get(`input[name="role"][value="${user_2.role}"]`).click();

      cy.get("button").contains("Continue").click();

      // validate both users are on the page
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(3)").contains(user_1.email).should("exist");
      cy.get("table td:nth-child(3)").contains(user_2.email).should("exist");

      // should redirect to confirmation page
      cy.contains("tr", user_2.email).find("a").contains("Delete").click();
      cy.get("h1").contains("Delete").should("exist");

      // click continue without selecting an option displays errors
      cy.get("button").contains("Continue").click();
      cy.get("h2").contains("There is a problem").should("exist");
      cy.get("span").contains("select an option").should("exist");

      // clicking no and continue should return to the confirm page and both users should appear
      cy.get('input[name="confirm"][value="no"]').click();
      cy.get("button").contains("Continue").click();
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(3)").contains(user_1.email).should("exist");
      cy.get("table td:nth-child(3)").contains(user_2.email).should("exist");

      // deleting user should return to confirm page with only one user
      cy.contains("tr", user_1.email).find("a").contains("Delete").click();
      cy.get("h1")
        .contains(`Delete ${user_1.first_name} ${user_1.last_name}`)
        .should("exist");
      cy.get('input[name="confirm"][value="yes"]').click();
      cy.get("button").contains("Continue").click();
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(3)")
        .contains(user_1.email)
        .should("not.exist");
      cy.get("table td:nth-child(3)").contains(user_2.email).should("exist");
    });

    it("Edit Button - able to edit details and redirects to add user form with preopulated fields", () => {
      cy.full_login("USER_MANAGER");
      cy.visit(addUserUrl());
      cy.clearCookie("add_user_form");
      // initialise user details
      const user_1 = {
        first_name: "Marcus",
        last_name: "Decimus Meridius",
        email: "marcusdecimusmeridius@example.com",
        role: "Analyst",
        role_display_name: "Data Analyst",
      };
      const user_2 = {
        first_name: "Luke",
        last_name: "Skywalker",
        email: "lukeskywalker@example.com",
        role: "UserManager",
        role_display_name: "User Manager",
      };

      // add first user
      cy.get('input[name="first_name"]').type(user_1.first_name);
      cy.get('input[name="last_name"]').type(user_1.last_name);
      cy.get('input[name="email"]').type(user_1.email);
      cy.get('input[name="email_confirm"]').type(user_1.email);
      cy.get(`input[name="role"][value="${user_1.role}"]`).click();

      cy.get("button").contains("Continue").click();

      // validate user details are on page
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(1)")
        .contains(user_1.first_name)
        .should("exist");
      cy.get("table td:nth-child(2)")
        .contains(user_1.last_name)
        .should("exist");
      cy.get("table td:nth-child(3)").contains(user_1.email).should("exist");
      cy.get("table td:nth-child(4)")
        .contains(user_1.role_display_name)
        .should("exist");

      // click the edit link
      cy.get("a").contains("Edit").click();

      // fields should be populated with the user details
      cy.get('input[name="first_name"]').should(
        "have.value",
        user_1.first_name
      );
      cy.get('input[name="last_name"]').should("have.value", user_1.last_name);
      cy.get('input[name="email"]').should("have.value", user_1.email);
      cy.get('input[name="email_confirm"]').should("have.value", user_1.email);
      cy.get(`input[name="role"][value="${user_1.role}"]`).should("be.checked");

      // modify the users details
      cy.get('input[name="first_name"]').clear();
      cy.get('input[name="first_name"]').type(user_2.first_name);
      cy.get('input[name="last_name"]').clear();
      cy.get('input[name="last_name"]').type(user_2.last_name);
      cy.get('input[name="email"]').clear();
      cy.get('input[name="email"]').type(user_2.email);
      cy.get('input[name="email_confirm"]').clear();
      cy.get('input[name="email_confirm"]').type(user_2.email);
      cy.get(`input[name="role"][value="${user_2.role}"]`).click();

      cy.get("button").contains("Continue").click();

      // validate the users details have been updated
      cy.url().should("include", "/add-user/confirm");
      cy.get("table td:nth-child(1)")
        .contains(user_2.first_name)
        .should("exist");
      cy.get("table td:nth-child(2)")
        .contains(user_2.last_name)
        .should("exist");
      cy.get("table td:nth-child(3)").contains(user_2.email).should("exist");
      cy.get("table td:nth-child(4)")
        .contains(user_2.role_display_name)
        .should("exist");
    });
  }
);

describe_only_if_manage_users_flag_enabled("Add user form validation", () => {
  beforeEach(() => {
    cy.full_login("USER_MANAGER");
    cy.visit(addUserUrl());
    cy.get("h1").contains("Add a new user").should("exist");
  });

  it("Errors if you dont click final confirm", () => {
    setTestAddUserFormCookie("Bob", "Ross", "bob.ross@example.com", "Analyst");
    cy.visit(addUserConfirmUrl());
    cy.url().should("include", "/add-user/confirm");
    cy.get("h1")
      .contains("Confirm user details", { timeout: 15 * 2000 })
      .should("exist");
    // Should redirect to the confirm page and the page should contain the user details
    // check the confirm user details page appears correct
    cy.url().should("include", "/add-user/confirm");
    cy.get("table td:nth-child(1)").contains("Bob").should("exist");
    cy.get("table td:nth-child(2)").contains("Ross").should("exist");
    cy.get("table td:nth-child(3)")
      .contains("bob.ross@example.com")
      .should("exist");
    cy.get("table td:nth-child(4)").contains("Analyst").should("exist");
    // press confirm and wait for response
    cy.get("button").contains("Confirm users").click({ force: true });
    cy.contains("You must confirm that these details are correct").should(
      "exist"
    );
  });

  it("Errors on missing inputs", () => {
    // Try to click continue with an empty form
    cy.get("button").contains("Continue").click();
    cy.get("h1").contains("Add a new user");
    // Verify that the Error summary checks appears and contains correct information
    cy.get("h2").contains("There is a problem");
    cy.get("a").contains("Enter a first name").should("exist");
    cy.get("a").contains("Enter a last name").should("exist");
    cy.get("a").contains("Enter an email address").should("exist");
    cy.get("a").contains("Select a role").should("exist");
    // Verify that the Field error checks appears and contains correct information
    cy.get("span").contains("Enter a first name").should("exist");
    cy.get("span").contains("Enter a last name").should("exist");
    cy.get("span").contains("Enter an email address").should("exist");
    cy.get("span").contains("Select a role").should("exist");
  });

  it("Errors on fields exceeding limit", () => {
    // Fill out the form with inputs that exceed the character limit
    cy.get('input[name="first_name"]').type("L".repeat(31));
    cy.get('input[name="last_name"]').type("O".repeat(31));
    cy.get('input[name="email"]').type("L".repeat(121));
    cy.get("button").contains("Continue").click();

    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a")
      .contains("First name must be less than 30 characters")
      .should("exist");
    cy.get("a")
      .contains("Last name must be less than 30 characters")
      .should("exist");
    cy.get("a")
      .contains("Email must be less than 100 characters")
      .should("exist");
    // Verify that the Field error checks appears and contains correct information
    cy.get("span")
      .contains("First name must be less than 30 characters")
      .should("exist");
    cy.get("span")
      .contains("Last name must be less than 30 characters")
      .should("exist");
    cy.get("span")
      .contains("Email must be less than 100 characters")
      .should("exist");
  });

  it("Emails must match", () => {
    // Fill out the form with emails that do not match
    cy.get('input[name="first_name"]').type("Bob");
    cy.get('input[name="last_name"]').type("Ross");
    cy.get('input[name="email"]').type("bob.ross@example.com");
    cy.get('input[name="email_confirm"]').type("bobb.ross@example.com");
    cy.get('input[name="role"][value="Analyst"]').click();
    cy.get("button").contains("Continue").click();
    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a").contains("Your email addresses must match").should("exist");
    // Verify that the Field error checks appears and contains correct information
    cy.get("span").contains("Your email addresses must match").should("exist");
  });

  it("Email already exists", () => {
    // Fill out the form with emails that do not match
    cy.get('input[name="first_name"]').type("Bob");
    cy.get('input[name="last_name"]').type("Ross");
    cy.get('input[name="email"]').type("bob.ross@example.com");
    cy.get('input[name="email_confirm"]').type("bob.ross@example.com");
    cy.get('input[name="role"][value="Analyst"]').click();
    cy.get("button").contains("Continue").click();
    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a").contains("This user already exists").should("exist");
    // Verify that the Field error checks appears and contains correct information
    cy.get("span").contains("This user already exists").should("exist");
  });

  it("First and last name only accepts chars, hyphens, apostrophes", () => {
    // Fill out the form with first and last names that contain invalid characters
    cy.get('input[name="first_name"]').type("1234");
    cy.get('input[name="last_name"]').type("!@#$");
    cy.get("button").contains("Continue").click();
    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a")
      .contains(
        "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("exist");
    cy.get("a")
      .contains(
        "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("exist");

    // Fill out the form with first and last names that contain valid characters
    cy.get('input[name="first_name"]').clear().type("🤠");
    cy.get('input[name="last_name"]')
      .clear()
      .type("करो या न करो। वहां कोई प्रयास नहीं हुआ।");
    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a")
      .contains(
        "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("exist");
    cy.get("a")
      .contains(
        "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("exist");

    // Fill out the form with first and last names that contain valid characters
    cy.get('input[name="first_name"]').clear().type("Maximus'");
    cy.get('input[name="last_name"]').clear().type("Decimus-Meridius");
    cy.get("button").contains("Continue").click();

    // Verify that the Error summary checks appears and contains correct information
    cy.get("h1").contains("Add a new user");
    cy.get("h2").contains("There is a problem");
    cy.get("a")
      .contains(
        "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("not.exist");
    cy.get("a")
      .contains(
        "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .should("not.exist");
  });

  it("Trims whitespace on inputs but preserve in middle of names", () => {
    // Fill out the form with first and last names that contain whitespace
    cy.get('input[name="first_name"]').type("            Bob ");
    cy.get('input[name="last_name"]').type("Ro ss            ");
    cy.get('input[name="email"]').type("         bob.rosss@example.com");
    cy.get('input[name="email_confirm"]').type(
      "bob.rosss@example.com           "
    );
    cy.get('input[name="role"][value="Analyst"]').click();
    cy.get("button").contains("Continue").click();
    // Should redirect to the confirm page and the page should contain the user details with whitespace trimmed
    cy.url().should("include", "/add-user/confirm");
    cy.get("table td:nth-child(1)").contains("Bob").should("exist");
    cy.get("table td:nth-child(2)").contains("Ro ss").should("exist");
  });

  it("Advanced email validation", () => {
    const test_cases = [
      // normal email
      {
        is_valid: true,
        email: "testexampleuser@nhs.net",
        error_message: undefined,
      },
      // allow subaddressing
      {
        is_valid: true,
        email: "testexampleuser+subaddress@nhs.net",
        error_message: undefined,
      },
      // expects a standard email format
      {
        is_valid: false,
        email: "testexampleuser",
        error_message:
          "Enter an email address in the correct format like, name@example.com",
      },
      // first part of email cannot be over 64 characters
      {
        is_valid: false,
        email:
          "testexampleuser+aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@nhs.net",
        error_message:
          "First part of your email address must be 64 characters or less",
      },
      // last part of email cannot be over 64 characters
      {
        is_valid: false,
        email:
          "testexampleuser@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaanhs.net",
        error_message:
          "Last part of your email address must be 64 characters or less",
      },
      // Gitlab -> contain letters, digits, '_', '-', '.'
      {
        is_valid: true,
        email: "test_example-user.extra@nhs.net",
        error_message: undefined,
      },
      {
        is_valid: false,
        email: "test$exampleuser@nhs.net",
        error_message:
          "Your email can only contain letters, digits, underscore, hyphen, full stop and the @ symbol",
      },
      {
        is_valid: false,
        email: "test'exampleuser@nhs.net",
        error_message:
          "Your email can only contain letters, digits, underscore, hyphen, full stop and the @ symbol",
      },
      // GitLab -> username must not start with a special character
      {
        is_valid: false,
        email: "+testexampleuser@nhs.net",
        error_message: "Your email must not start with a special character",
      },
      {
        is_valid: false,
        email: "-testexampleuser@nhs.net",
        error_message: "Your email must not start with a special character",
      },
      {
        is_valid: false,
        email: "_testexampleuser@nhs.net",
        error_message: "Your email must not start with a special character",
      },
      // GitLab -> username must end with a special character
      {
        is_valid: false,
        email: "testexampleuser+@nhs.net",
        error_message:
          "The first part of your email must not end with a special character",
      },
      {
        is_valid: false,
        email: "testexampleuser-@nhs.net",
        error_message:
          "The first part of your email must not end with a special character",
      },
      {
        is_valid: false,
        email: "testexampleuser_@nhs.net",
        error_message:
          "The first part of your email must not end with a special character",
      },
      // Gitlab -> username must not end with a special character
      {
        is_valid: false,
        email: "testexample__user@nhs.net",
        error_message:
          "Your email may not contain consecutive special characters",
      },
      {
        is_valid: false,
        email: "testexample_-user@nhs.net",
        error_message:
          "Your email may not contain consecutive special characters",
      },
      // Gitlab -> Cannot end in '.', '.git' or '.atom'.
      {
        is_valid: false,
        email: "testexampleuser@nhs.git",
        error_message: "Your email cannot end with '.' , '.git' or '.atom'",
      },
      {
        is_valid: false,
        email: "testexampleuser@nhs.atom",
        error_message: "Your email cannot end with '.' , '.git' or '.atom'",
      },
      {
        is_valid: false,
        email: "testexampleuser@nhs.",
        error_message: "Your email cannot end with '.' , '.git' or '.atom'",
      },
    ];

    function perform_test(
      is_valid: boolean,
      email: string,
      error_message: string | undefined
    ) {
      cy.visit(addUserUrl());
      cy.get("h1").contains("Add a new user").should("exist");
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="email_confirm"]').type(email);

      cy.get("button").contains("Continue").click();

      cy.get("h2").contains("There is a problem").should("exist");

      if (is_valid) {
        if (error_message) {
          throw new Error(
            "Error with test input, expects no error message on valid event"
          );
        }
        // expect no error on the input field
        cy.get('input[name="email"]').should(
          "not.have.class",
          "nhsuk-input--error"
        );
      } else {
        if (!error_message) {
          throw new Error(
            "Error with test input, expects error message when event is invalid"
          );
        }
        cy.get("a").contains(error_message).should("exist"); // error summary
        cy.get("span").contains(error_message).should("exist"); // on input field
      }
    }

    for (const test_case of test_cases) {
      const { is_valid, email, error_message } = test_case;
      perform_test(is_valid, email, error_message);
    }
  });
});
export {};
