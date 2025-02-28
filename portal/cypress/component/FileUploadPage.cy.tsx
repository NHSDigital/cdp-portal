import { SessionContext } from "next-auth/react";
import React from "react";
import FileUpload, {
  sessionGetter,
} from "../../pages/agreement/[agreement_id]/fileupload";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";

const getFileUploadPageJSX = () => {
  return (
    <RouterContext.Provider
      // @ts-ignore
      value={{
        query: { agreement_id: "dsa-000-fake" },
        push: cy.stub().as("fake_router_push"),
      }}
    >
      <SessionContext.Provider
        // @ts-ignore
        value={{ data: { user: { email: "fake@fake.fake" } } }}
      >
        <FileUpload notificationItems={[]} />
      </SessionContext.Provider>
    </RouterContext.Provider>
  );
};

describe("<FileUploadPage />", () => {
  beforeEach(() => {
    cy.stub(sessionGetter, "getSession").callsFake(() => "nonNullValue");
  });
  it("loads without crashing", () => {
    cy.mount(getFileUploadPageJSX());
    cy.contains("h1", "Import reference data");
  });

  it("can load a valid file successfully", () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept("POST", "/api/fileexistscheck", {
      statusCode: 200,
      body: { message: "File does not exist" },
    }).as("fake_file_exists_req");
    cy.intercept("POST", "/api/getfileuploadurl", {
      statusCode: 200,
      body: { url: "/api/fakeupload", fields: ["hello"] },
    }).as("fake_get_url_req");
    cy.intercept("POST", "/api/fakeupload", {
      statusCode: 204,
      body: {},
    }).as("fake_upload_req");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "valid.csv",
    });
    cy.get("button").contains("Continue to upload").click();
    cy.wait("@fake_file_exists_req");
    cy.get("button").contains("Submit file").click();
    cy.wait("@fake_get_url_req");
    cy.wait("@fake_upload_req");
    cy.get("@fake_router_push").should("be.calledOnce");
    cy.get("@fake_router_push").should(
      "be.calledOnceWithExactly",
      "/agreement/dsa-000-fake/fileuploadsuccess"
    );
  });

  it("disables the loading button when submit is pressed", () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept("POST", "/api/fileexistscheck", {
      statusCode: 200,
      body: { message: "File does not exist" },
      delay: 100,
    }).as("fake_file_exists_req");
    cy.intercept("POST", "/api/getfileuploadurl", {
      statusCode: 200,
      body: { url: "/api/fakeupload", fields: ["hello"] },
      delay: 100,
    }).as("fake_get_url_req");
    cy.intercept("POST", "/api/fakeupload", {
      statusCode: 204,
      body: {},
      delay: 100,
    }).as("fake_upload_req");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "valid.csv",
    });
    cy.get("button").contains("Continue to upload").click();
    cy.get("button").contains("Loading").should("be.disabled");
    cy.wait("@fake_file_exists_req");
    cy.get("button").contains("Submit file").click();
    cy.get("button").contains("Loading").should("be.disabled");
    cy.wait("@fake_get_url_req");
    cy.wait("@fake_upload_req");
    cy.get("@fake_router_push").should("be.calledOnce");
    cy.get("@fake_router_push").should(
      "be.calledOnceWithExactly",
      "/agreement/dsa-000-fake/fileuploadsuccess"
    );
  });

  it("errors with no file selected", () => {
    cy.mount(getFileUploadPageJSX());
    cy.contains("button", "Continue to upload").click();
    cy.get("span.nhsuk-error-message")
      .contains("Please choose a file")
      .should("exist");
    cy.get("button").contains("Submit file").should("not.exist");
  });

  it("errors when an identically named file is still being processed", () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept("POST", "/api/fileexistscheck", {
      statusCode: 400,
      body: { message: "File already exists" },
    }).as("fake_file_exists_req");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "valid.csv",
    });
    cy.contains("button", "Continue to upload").click();

    cy.wait("@fake_file_exists_req");
    cy.get("span.nhsuk-error-message")
      .contains("A file with the same name is still being processed")
      .should("exist");
    cy.get("button").contains("Submit file").should("not.exist");
  });

  it("lets you upload a different file after an error", () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept("POST", "/api/fileexistscheck", {
      statusCode: 200,
      body: { message: "File does not exist" },
    }).as("fake_file_exists_req");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "invalid name.csv",
    });
    cy.contains("button", "Continue to upload").click();

    cy.get("span.nhsuk-error-message")
      .contains("The selected file does not have the correct naming convention")
      .should("exist");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "renamed_valid.csv",
    });
    cy.contains("button", "Continue to upload").click();
    cy.wait("@fake_file_exists_req");

    cy.get("button").contains("Submit file").should("exist");
    cy.get("span.nhsuk-error-message").should("not.exist");

    cy.get("button").contains("Submit file").should("exist");
  });

  it("lets you remove a file after initial check and upload a different file", () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept("POST", "/api/fileexistscheck", {
      statusCode: 200,
      body: { message: "File does not exist" },
    }).as("fake_file_exists_req");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("a,b\n1,2\n3,4"),
      fileName: "valid.csv",
    });
    cy.get("button").contains("Continue to upload").click();

    cy.get("h3").contains("Before you submit the file").should("exist");
    cy.get("button").contains("Remove file").click();

    cy.get("h3").contains("Before you submit the file").should("not.exist");

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("c,d\n1,2\n3,4"),
      fileName: "another_valid.csv",
    });
    cy.get("button").contains("Continue to upload").click();
  });

  [
    { errMsg: "The selected file is empty", fileContents: "" },
    { errMsg: "The selected file must be a CSV", fileName: "hello.ppt" },
    {
      errMsg: "The selected file does not have the correct naming convention",
      fileName: "file names cant contain spaces alas.csv",
    },
    {
      errMsg: "The selected file is larger than 1MB",
      fileContents: "verybig".repeat(1000000),
    },
  ].forEach(({ errMsg, fileContents = "a,b\n1,2\n3,4", ...fileSettings }) => {
    it(`shows error message "${errMsg}"`, () => {
      const fileToUpload = {
        fileName: "invalid.csv",
        ...fileSettings,
        contents: Cypress.Buffer.from(fileContents),
      };

      cy.mount(getFileUploadPageJSX());
      cy.get('input[type="file"]').selectFile(fileToUpload);
      cy.get("button").contains("Continue to upload").click();
      cy.get("span.nhsuk-error-message").contains(errMsg).should("exist");
      cy.get("button").contains("Submit file").should("not.exist");
    });
  });
});
