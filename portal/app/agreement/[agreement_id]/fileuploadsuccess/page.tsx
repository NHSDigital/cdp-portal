import { Metadata } from 'next';
import Link from 'next/link';

import { SDE_INPUT_CHECKS_EMAIL } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `File upload success - ${whiteLabelValues.acronym}`,
  };
}

interface FileUploadSuccessPageProps {
  params: Promise<{ agreement_id: string }>;
}

async function FileUploadSuccessPage({ params }: FileUploadSuccessPageProps) {
  const resolvedParams = await params;
  const agreement_id = resolvedParams.agreement_id;
  const whiteLabelValues = getWhiteLabelValues();
  return (
    <>
      <h1>
        <span className='nhsuk-caption-l'>
          {agreement_id}
          <span className='nhsuk-u-visually-hidden'> - </span>
        </span>
        Your file is being checked
      </h1>
      <p>
        You will receive a confirmation email once the file has been checked.
        This should take less than 24 hours.
      </p>
      <p>
        If there are any technical errors we will tell you what you need to
        amend.
      </p>
      <h2>What you need to do next</h2>
      <div className='nhsuk-inset-text'>
        <span className='nhsuk-u-visually-hidden'>Information: </span>
        <p>
          In order for your request to be processed, please ensure that you now
          provide contextual information to{' '}
          <a href={`mailto:${SDE_INPUT_CHECKS_EMAIL}`} target='_blank'>
            {SDE_INPUT_CHECKS_EMAIL}
          </a>
          .
        </p>
        <p>
          This should explain what the data contains and how it will complement
          other data to help you with your research.
        </p>
        <p>
          <a
            href='https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data#providing-contextual-information'
            target='blank'
          >
            Learn more about how to send contextual information (opens in a new
            window).
          </a>
        </p>
      </div>
      <h2>Safe Input Service</h2>
      <p>
        Once we have received your contextual information and checked your
        uploaded file(s), the Safe Input Service will check for Personally
        Identifiable Information (PII).
      </p>
      <p>
        If your data fails to meet the mandatory criteria, you will receive an
        email explaining why and how to correct it.
      </p>
      <p>
        If it meets the requirements, you will receive an email when the data is
        ready to use within the {whiteLabelValues.longName}.
      </p>
      <p>We aim to respond to all requests within 5 working days.</p>
      <br />
      <div>
        <Link className='nhsuk-button' href={`../${agreement_id}`}>
          Finish
        </Link>
      </div>
      <div>
        <Link
          className='nhsuk-button nhsuk-button--secondary'
          href='./fileupload'
        >
          Upload another file
        </Link>
      </div>
    </>
  );
}

export default FileUploadSuccessPage;
