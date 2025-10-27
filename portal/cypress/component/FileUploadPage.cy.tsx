import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { SessionContext } from 'next-auth/react';
import React from 'react';

import FileUploadClientSidePage from '@/app/agreement/[agreement_id]/fileupload/_components/FileUploadClientSidePage';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import { sessionGetter } from '../../app/agreement/[agreement_id]/fileupload/_components/FileSelectionComponent';

const getFileUploadPageJSX = (max_file_size = 2 * 1024 * 1024 * 1024) => {
  process.env.PORTAL_SERVICE = 'SDE';
  const whiteLabelValues = getWhiteLabelValues();
  return (
    <PathParamsContext.Provider value={{ agreement_id: 'dsa-000-fake' }}>
      <AppRouterContext.Provider
        value={{
          push: cy.stub().as('fake_router_push'),
          back: cy.stub(),
          forward: cy.stub(),
          refresh: cy.stub(),
          replace: cy.stub(),
          prefetch: cy.stub(),
        }}
      >
        <SessionContext.Provider
          value={{ data: { user: { email: 'fake@fake.fake' } } }}
        >
          <FileUploadClientSidePage
            agreementId='dsa-000-fake'
            max_file_size_in_bytes={max_file_size}
            whiteLabelValues={whiteLabelValues}
          />
        </SessionContext.Provider>
      </AppRouterContext.Provider>
    </PathParamsContext.Provider>
  );
};

describe('<FileUploadPage />', () => {
  beforeEach(() => {
    cy.stub(sessionGetter, 'getSession').returns(
      Promise.resolve('nonNullValue'),
    );
  });

  it('loads without crashing', () => {
    cy.mount(getFileUploadPageJSX());
    cy.contains('h1', 'Import reference data');
  });

  it('can load a valid file successfully', () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept('POST', '/api/fileexistscheck', {
      statusCode: 200,
      body: { message: 'File does not exist' },
    }).as('fake_file_exists_req');
    cy.intercept('POST', '/api/getfileuploadurl', {
      statusCode: 200,
      body: { url: '/api/fakeupload', fields: ['hello'] },
    }).as('fake_get_url_req');
    cy.intercept('POST', '/api/fakeupload', {
      statusCode: 204,
      body: {},
    }).as('fake_upload_req');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'valid.csv',
    });
    cy.get('button').contains('Continue to upload').click();
    cy.wait('@fake_file_exists_req');
    cy.get('button').contains('Submit file').click();
    cy.wait('@fake_get_url_req');
    cy.wait('@fake_upload_req');
    cy.get('@fake_router_push').should('be.calledOnce');
    cy.get('@fake_router_push').should(
      'be.calledOnceWithExactly',
      '/agreement/dsa-000-fake/fileuploadsuccess',
    );
  });

  it('disables the loading button when submit is pressed', () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept('POST', '/api/fileexistscheck', {
      statusCode: 200,
      body: { message: 'File does not exist' },
      delay: 100,
    }).as('fake_file_exists_req');
    cy.intercept('POST', '/api/getfileuploadurl', {
      statusCode: 200,
      body: { url: '/api/fakeupload', fields: ['hello'] },
      delay: 100,
    }).as('fake_get_url_req');
    cy.intercept('POST', '/api/fakeupload', {
      statusCode: 204,
      body: {},
      delay: 100,
    }).as('fake_upload_req');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'valid.csv',
    });
    cy.get('button').contains('Continue to upload').click();
    cy.get('button').contains('Loading').should('be.disabled');
    cy.wait('@fake_file_exists_req');
    cy.get('button').contains('Submit file').click();
    cy.get('button').contains('Loading').should('be.disabled');
    cy.wait('@fake_get_url_req');
    cy.wait('@fake_upload_req');
    cy.get('@fake_router_push').should('be.calledOnce');
    cy.get('@fake_router_push').should(
      'be.calledOnceWithExactly',
      '/agreement/dsa-000-fake/fileuploadsuccess',
    );
  });

  it('errors with no file selected', () => {
    cy.mount(getFileUploadPageJSX());
    cy.contains('button', 'Continue to upload').click();
    cy.get('span.nhsuk-error-message')
      .contains('Please choose a file')
      .should('exist');
    cy.get('button').contains('Submit file').should('not.exist');
  });

  it('errors when an identically named file is still being processed', () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept('POST', '/api/fileexistscheck', {
      statusCode: 400,
      body: { message: 'File already exists' },
    }).as('fake_file_exists_req');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'valid.csv',
    });
    cy.contains('button', 'Continue to upload').click();
    cy.wait('@fake_file_exists_req');
    cy.get('span.nhsuk-error-message')
      .contains('A file with the same name is still being processed')
      .should('exist');
    cy.get('button').contains('Submit file').should('not.exist');
  });

  it('lets you upload a different file after an error', () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept('POST', '/api/fileexistscheck', {
      statusCode: 200,
      body: { message: 'File does not exist' },
    }).as('fake_file_exists_req');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'invalid name.csv',
    });
    cy.contains('button', 'Continue to upload').click();
    cy.get('span.nhsuk-error-message')
      .contains('The selected file does not have the correct naming convention')
      .should('exist');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'renamed_valid.csv',
    });
    cy.contains('button', 'Continue to upload').click();
    cy.wait('@fake_file_exists_req');

    cy.get('button').contains('Submit file').should('exist');
    cy.get('span.nhsuk-error-message').should('not.exist');
  });

  it('lets you remove a file after initial check and upload a different file', () => {
    cy.mount(getFileUploadPageJSX());
    cy.intercept('POST', '/api/fileexistscheck', {
      statusCode: 200,
      body: { message: 'File does not exist' },
    }).as('fake_file_exists_req');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'valid.csv',
    });
    cy.get('button').contains('Continue to upload').click();
    cy.get('h3').contains('Before you submit the file').should('exist');

    cy.get('button').contains('Remove file').click();
    cy.get('h3').contains('Before you submit the file').should('not.exist');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('c,d\n1,2\n3,4'),
      fileName: 'another_valid.csv',
    });
    cy.get('button').contains('Continue to upload').click();
  });

  [
    { errMsg: 'The selected file is empty', fileContents: '' },
    { errMsg: 'The selected file must be a CSV', fileName: 'hello.ppt' },
    {
      errMsg: 'The selected file does not have the correct naming convention',
      fileName: 'file names cant contain spaces alas.csv',
    },
  ].forEach(({ errMsg, fileContents = 'a,b\n1,2\n3,4', ...fileSettings }) => {
    it(`shows error message "${errMsg}"`, () => {
      const fileToUpload = {
        fileName: 'invalid.csv',
        ...fileSettings,
        contents: Cypress.Buffer.from(fileContents),
      };

      cy.mount(getFileUploadPageJSX());
      cy.get('input[type="file"]').selectFile(fileToUpload);
      cy.get('button').contains('Continue to upload').click();
      cy.get('span.nhsuk-error-message').contains(errMsg).should('exist');
      cy.get('button').contains('Submit file').should('not.exist');
    });
  });
  it(`shows error message if exceeds max file size`, () => {
    // cannot create a test file large enough exceeding 2GB so instead use 5Mb limit to test behaviour
    const line = 'a,b,c,d,e,f,g,h,i,j';
    const approxLines = Math.ceil((6 * 1024 * 1024) / line.length);
    let csvContent = '';

    for (let i = 0; i < approxLines; i++) {
      csvContent += line;
    }

    const fileToUpload = {
      fileName: 'large.csv',
      contents: Cypress.Buffer.from(csvContent),
    };

    cy.mount(getFileUploadPageJSX(5 * 1024 * 1024));

    cy.get('input[type="file"]').selectFile(fileToUpload);

    cy.get('button').contains('Continue to upload').click();
    cy.get('span.nhsuk-error-message')
      .contains('The selected file is larger than 5MB')
      .should('exist');
    cy.get('button').contains('Submit file').should('not.exist');
  });
});
