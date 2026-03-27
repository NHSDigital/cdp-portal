'use client';

import { useParams, useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { Button, ErrorMessage } from 'nhsuk-react-components';
import React from 'react';
import { ChangeEvent, useState } from 'react';

import { useAsyncError } from '@/helpers/errorHelpers';

type FileValidationState =
  | { stage: 'preValidation' }
  | { stage: 'validated' }
  | { stage: 'loading' }
  | { stage: 'error'; error: string };

// Putting it in an object makes it mockable
const sessionGetter = { getSession };

class UserReadableValidationError extends Error {
  userReadableMessage: string;

  constructor(userReadableMessage: string) {
    super(userReadableMessage);
    this.userReadableMessage = userReadableMessage;
  }
}

const fileValidator = async (
  file: File | null,
  agreement_id: string,
  max_file_size_in_bytes: number,
): Promise<void> => {
  const MIN_FILE_SIZE = 0; // Empty File
  if (!file) {
    throw new UserReadableValidationError('Please choose a file.');
  }

  const fileSizeKiloBytes = file.size / 1024;

  if (fileSizeKiloBytes <= MIN_FILE_SIZE) {
    throw new UserReadableValidationError('The selected file is empty.');
  }

  if (!file.name.endsWith('.csv')) {
    throw new UserReadableValidationError('The selected file must be a CSV.');
  }

  // Regex to check the file name does not contain Uppercase letters, whitespace or symbols, with the exception of underscore.
  if (/^[a-z0-9_]+\.csv$/.test(file.name) === false) {
    throw new UserReadableValidationError(
      'The selected file does not have the correct naming convention. Please refer to our guidance page for information about naming the file correctly.',
    );
  }

  if (file?.size > max_file_size_in_bytes) {
    throw new UserReadableValidationError(
      `The selected file is larger than ${formatBytes(max_file_size_in_bytes)}`,
    );
  }

  let fileExistsCheckResponse;
  try {
    fileExistsCheckResponse = await fetch('/api/fileexistscheck', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        agreementId: agreement_id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new UserReadableValidationError(
      'There was an unexpected error when trying to upload the file.',
    );
  }

  if (fileExistsCheckResponse.status === 400)
    throw new UserReadableValidationError(
      'A file with the same name is still being processed. Please email england.sde.input-checks@nhs.net if you would like the new file to replace the one being processed.',
    );

  if (fileExistsCheckResponse.status !== 200)
    throw new UserReadableValidationError(
      'There was an unexpected error when trying to upload the file.',
    );
};

const useFileValidationState = (max_file_size_in_bytes: number) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationState, setFileValidationState] =
    useState<FileValidationState>({ stage: 'preValidation' });
  const { agreement_id } = useParams() as { agreement_id: string };

  const router = useRouter();

  const clearFile = () => {
    setSelectedFile(null);
    setFileValidationState({ stage: 'preValidation' });
  };

  const validateFile = async () => {
    try {
      const isUserSignedOut = (await sessionGetter.getSession()) === null;
      if (isUserSignedOut) {
        router.push('/welcome');
        return;
      }

      setFileValidationState({ stage: 'loading' });
      await fileValidator(selectedFile, agreement_id, max_file_size_in_bytes);
      setFileValidationState({ stage: 'validated' });
    } catch (err) {
      setFileValidationState({
        stage: 'error',
        error:
          err.userReadableMessage ||
          'An unexpected error occurred, please try again.',
      });
    }
  };

  return {
    selectedFile,
    setSelectedFile,
    fileValidationState,
    clearFile,
    validateFile,
  };
};

function FileSelectionComponent({
  max_file_size_in_bytes,
}: {
  max_file_size_in_bytes: number;
}) {
  const {
    selectedFile,
    setSelectedFile,
    fileValidationState,
    clearFile,
    validateFile,
  } = useFileValidationState(max_file_size_in_bytes);
  switch (fileValidationState.stage) {
    case 'preValidation':
    case 'loading':
    case 'error':
      return (
        <PreValidationStage
          validationError={
            fileValidationState.stage == 'error'
              ? fileValidationState.error
              : null
          }
          isLoading={fileValidationState.stage == 'loading'}
          {...{ setSelectedFile, validateFile }}
        />
      );
    case 'validated':
      return <ValidatedSuccessStage {...{ selectedFile, clearFile }} />;
  }
}

function PreValidationStage({
  setSelectedFile,
  validateFile,
  validationError,
  isLoading,
}) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target?.files?.length) {
      setSelectedFile(event.target.files[0]);
    }
  };
  return (
    <>
      <label htmlFor='file-upload-1' id='file-upload-label'>
        <h3>Upload your file</h3>
      </label>
      <p>You can upload one file at a time.</p>
      <br />
      <div
        className={
          'nhsuk-form-group' +
          (validationError ? ' nhsuk-form-group--error' : '')
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            validateFile();
          }}
        >
          {validationError && (
            <ErrorMessage style={{ marginBottom: 10 }}>
              {validationError}
            </ErrorMessage>
          )}
          <input
            className='file-upload'
            id='file-upload-1'
            name='file-upload-1'
            type='file'
            onChange={handleFileChange}
            aria-describedby='file-upload-label'
            style={{ marginBottom: 30, display: 'block' }}
          />
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Loading' : 'Continue to upload'}
          </Button>
        </form>
      </div>
    </>
  );
}

function ValidatedSuccessStage({ selectedFile, clearFile }) {
  const router = useRouter();
  const { agreement_id } = useParams() as { agreement_id: string };
  const [isLoading, setIsLoading] = useState(false);
  const throwAsyncError = useAsyncError();

  return (
    <>
      <h3>Before you submit the file</h3>
      <p className='success-message'>
        Check the filename is correct. You can upload one file at a time.
        <br />
        You will be able to upload another file after submitting
      </p>
      <dl className='nhsuk-summary-list'>
        <div className='nhsuk-summary-list__row'>
          <dd className='nhsuk-summary-list__value'>{selectedFile.name}</dd>
          <dd className='nhsuk-summary-list__actions'>
            <button
              type='button'
              onClick={clearFile}
              className='button-as-link nhsuk-summary-list'
              style={{ textAlign: 'right', marginBottom: '0px' }}
            >
              Remove file
            </button>
          </dd>
        </div>
      </dl>
      <form
        method='post'
        onSubmit={(e) => {
          setIsLoading(true);
          uploadFileToS3(
            e,
            agreement_id,
            router,
            selectedFile,
            throwAsyncError,
          );
        }}
      >
        <input type='hidden' name='agreement_id' value={agreement_id} />
        <input type='hidden' name='uses_js' value='false' />
        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Loading' : 'Submit file'}
        </Button>
      </form>
    </>
  );
}

const uploadFileToS3 = async (
  event,
  agreement_id,
  router,
  selectedFile,
  throwAsyncError,
) => {
  event.preventDefault();

  try {
    const isUserSignedOut = (await sessionGetter.getSession()) === null;
    if (isUserSignedOut) {
      router.push('/welcome');
      return;
    }

    const getUrlResp = await fetch('/api/getfileuploadurl', {
      method: 'POST',
      body: JSON.stringify({
        agreement_id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (getUrlResp.status !== 200)
      throw new Error('Get upload URL page returned non 200 status code');

    const { url: uploadUrl, fields: uploadFields } =
      (await getUrlResp.json()) as { url: string; fields: string[] };

    const formData = new FormData();
    Object.entries(uploadFields).forEach(([field, value]) => {
      formData.append(field, value);
    });
    formData.append('file', selectedFile);

    const resp = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    if (resp.status !== 204)
      throw new Error('Upload returned non 200 status code');
  } catch (err) {
    console.error(err);
    throwAsyncError('Failed to upload file to S3');
  }
  router.push(`/agreement/${agreement_id}/fileuploadsuccess`);
};

function formatBytes(bytes: number): string {
  const GB = 1024 ** 3;
  const MB = 1024 ** 2;

  if (bytes % GB === 0) {
    return `${bytes / GB}GB`;
  } else if (bytes % MB === 0) {
    return `${bytes / MB}MB`;
  } else {
    return bytes >= GB
      ? `${(bytes / GB).toFixed(2)}GB`
      : `${(bytes / MB).toFixed(2)}MB`;
  }
}

export { FileSelectionComponent, sessionGetter };
