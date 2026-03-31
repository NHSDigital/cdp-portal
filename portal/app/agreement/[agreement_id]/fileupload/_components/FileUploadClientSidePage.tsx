'use client';

import Link from 'next/link';
import { BackLink, WarningCallout } from 'nhsuk-react-components';
import React from 'react';
import { useEffect } from 'react';

import { WhiteLabelEntry } from '@/config/whiteLabel';

import { FileSelectionComponent } from './FileSelectionComponent';

interface FileUploadClientSidePageProps {
  agreementId: string;
  max_file_size_in_bytes: number;
  whiteLabelValues: WhiteLabelEntry;
}

function FileUploadClientSidePage({
  agreementId,
  max_file_size_in_bytes,
  whiteLabelValues,
}: FileUploadClientSidePageProps) {
  const page_title = `Upload file to ${agreementId} - ${whiteLabelValues.acronym}`;

  useEffect(() => {
    document.title = page_title;
  }, [page_title]);

  return (
    <>
      <BackLink asElement={Link} href={`../${agreementId}`} data-cy='go-back'>
        Go back
      </BackLink>
      <h1>
        <span className='nhsuk-caption-l'>
          {agreementId}
          <span className='nhsuk-u-visually-hidden'> - </span>
        </span>
        Import reference data
      </h1>
      <p>
        Use this page to upload a reference data file, and request for the data
        to be added to the {whiteLabelValues.longName}.
      </p>
      <h2>Before you upload</h2>
      <p>
        Make sure you have followed the guidance on{' '}
        <a
          href='https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data'
          target='blank'
        >
          how to prepare your file (opens in a new window)
        </a>
        .
      </p>
      <WarningCallout>
        <h3 className='nhsuk-warning-callout__label'>Important</h3>
        <ul className='nhsuk-list nhsuk-list--bullet'>
          <li>
            Ensure that the CSV headers and columns/rows meet the formatting
            requirements
          </li>
          <li>
            Uploading a file with the same name will overwrite the original file
            in the environment
          </li>
          <li>
            To ensure the data is approved it must not contain any Personally
            Identifiable Information (PII)
          </li>
        </ul>
      </WarningCallout>

      <FileSelectionComponent max_file_size_in_bytes={max_file_size_in_bytes} />
    </>
  );
}

export default FileUploadClientSidePage;
