import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BackLink,
  Button,
  ErrorMessage,
  WarningCallout,
} from "nhsuk-react-components";
import { ChangeEvent, useRef, useState } from "react";
import BasePage from "../../../components/BasePage";
import getUserAgreements from "../../../services/getUserAgreements";
import { authOptions } from "../../api/auth/[...nextauth]";
import getNotifications, { Notices } from "../../../services/getNotifications";
import { getSession } from "next-auth/react";

// Putting it in an object makes it mockable
export const sessionGetter = { getSession };

function FileUploadPage({ notificationItems }: Notices) {
  const mainRef = useRef(null);
  const { agreement_id } = useRouter().query as {
    agreement_id: string;
  };

  const page_title = `Upload file to ${agreement_id} - SDE`;

  // The JSX mostly contains the static stuff
  // <FileSelectionComponent /> contains the interactive stuff
  return (
    <BasePage mainRef={mainRef} notificationItems={notificationItems}>
      <Head>
        <title>{page_title}</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <BackLink asElement={Link} href={`../${agreement_id}`}>
          Go back
        </BackLink>
        <h1>
          <span className="nhsuk-caption-l">
            {agreement_id}
            <span className="nhsuk-u-visually-hidden"> - </span>
          </span>
          Import reference data
        </h1>
        <p>
          Use this page to upload a reference data file, and request for the
          data to be added to the Secure Data Environment.
        </p>
        <h2>Before you upload</h2>
        <p>
          Make sure you have followed the guidance on{" "}
          <a
            href="https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data"
            target="blank"
          >
            how to prepare your file (opens in a new window)
          </a>
          .
        </p>
        <WarningCallout>
          <h3 className="nhsuk-warning-callout__label">Important</h3>
          <ul className="nhsuk-list nhsuk-list--bullet">
            <li>
              Ensure that the CSV headers and columns/rows meet the formatting
              requirements
            </li>
            <li>
              Uploading a file with the same name will overwrite the original
              file in the environment
            </li>
            <li>
              To ensure the data is approved it must not contain any Personally
              Identifiable Information (PII)
            </li>
          </ul>
        </WarningCallout>

        <FileSelectionComponent />
      </main>
    </BasePage>
  );
}

type FileValidationState =
  | { stage: "preValidation" }
  | { stage: "validated" }
  | { stage: "loading" }
  | { stage: "error"; error: string };

const useFileValidationState = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationState, setFileValidationState] =
    useState<FileValidationState>({ stage: "preValidation" });
  const { agreement_id } = useRouter().query as { agreement_id: string };
  const router = useRouter();

  const clearFile = () => {
    setSelectedFile(null);
    setFileValidationState({ stage: "preValidation" });
  };

  const validateFile = async () => {
    try {
      const isUserSignedOut = (await sessionGetter.getSession()) === null;
      if (isUserSignedOut) {
        router.push("/welcome");
        return;
      }

      setFileValidationState({ stage: "loading" });
      await fileValidator(selectedFile, agreement_id);
      setFileValidationState({ stage: "validated" });
    } catch (err) {
      setFileValidationState({
        stage: "error",
        error:
          err.userReadableMessage ||
          "An unexpected error occured, please try again.",
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

class UserReadableValidationError extends Error {
  userReadableMessage: string;

  constructor(userReadableMessage: string) {
    super(userReadableMessage);
    this.userReadableMessage = userReadableMessage;
  }
}

const fileValidator = async (
  file: File | null,
  agreement_id: string
): Promise<void> => {
  const MIN_FILE_SIZE = 0; // Empty file
  const MAX_FILE_SIZE = 1024; // 1MB

  if (!file) {
    throw new UserReadableValidationError("Please choose a file.");
  }

  const fileSizeKiloBytes = file.size / 1024;

  if (fileSizeKiloBytes == MIN_FILE_SIZE) {
    throw new UserReadableValidationError("The selected file is empty.");
  }

  if (!file.name.endsWith(".csv")) {
    throw new UserReadableValidationError("The selected file must be a CSV.");
  }

  // Regex to check the file name does not contain Uppercase letters, whitespace or symbols, with the exception of underscore.
  if (/^[a-z0-9_]+\.csv$/.test(file.name) === false) {
    throw new UserReadableValidationError(
      "The selected file does not have the correct naming convention. Please refer to our guidance page for information about naming the file correctly."
    );
  }

  if (fileSizeKiloBytes > MAX_FILE_SIZE) {
    throw new UserReadableValidationError(
      "The selected file is larger than 1MB."
    );
  }

  let fileExistsCheckResponse;
  try {
    fileExistsCheckResponse = await fetch("/api/fileexistscheck", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        agreementId: agreement_id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new UserReadableValidationError(
      "There was an unexpected error when trying to upload the file."
    );
  }

  if (fileExistsCheckResponse.status === 400)
    throw new UserReadableValidationError(
      "A file with the same name is still being processed. Please email england.sde.input-checks@nhs.net if you would like the new file to replace the one being processed."
    );

  if (fileExistsCheckResponse.status !== 200)
    throw new UserReadableValidationError(
      "There was an unexpected error when trying to upload the file."
    );
};

function FileSelectionComponent() {
  const {
    selectedFile,
    setSelectedFile,
    fileValidationState,
    clearFile,
    validateFile,
  } = useFileValidationState();

  switch (fileValidationState.stage) {
    case "preValidation":
    case "loading":
    case "error":
      return (
        <PreValidationStage
          validationError={
            fileValidationState.stage == "error"
              ? fileValidationState.error
              : null
          }
          isLoading={fileValidationState.stage == "loading"}
          {...{ setSelectedFile, validateFile }}
        />
      );
    case "validated":
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
      <label htmlFor="file-upload-1" id="file-upload-label">
        <h3>Upload your file</h3>
      </label>
      <p>You can upload one file at a time.</p>
      <br />
      <div
        className={
          "nhsuk-form-group" +
          (validationError ? " nhsuk-form-group--error" : "")
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
            className="file-upload"
            id="file-upload-1"
            name="file-upload-1"
            type="file"
            onChange={handleFileChange}
            aria-describedby="file-upload-label"
            style={{ marginBottom: 30, display: "block" }}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading" : "Continue to upload"}
          </Button>
        </form>
      </div>
    </>
  );
}

function ValidatedSuccessStage({ selectedFile, clearFile }) {
  const router = useRouter();
  const { agreement_id } = router.query as { agreement_id: string };
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <h3>Before you submit the file</h3>
      <p className="success-message">
        Check the filename is correct. You can upload one file at a time.
        <br />
        You will be able to upload another file after submitting
      </p>
      <dl className="nhsuk-summary-list">
        <div className="nhsuk-summary-list__row">
          <dd className="nhsuk-summary-list__value">{selectedFile.name}</dd>
          <dd className="nhsuk-summary-list__actions">
            <button
              type="button"
              onClick={clearFile}
              className="button-as-link nhsuk-summary-list"
              style={{ textAlign: "right", marginBottom: "0px" }}
            >
              Remove file
            </button>
          </dd>
        </div>
      </dl>
      <form
        method="post"
        onSubmit={(e) => {
          setIsLoading(true);
          uploadFileToS3(e, agreement_id, router, selectedFile);
        }}
      >
        <input type="hidden" name="agreement_id" value={agreement_id} />
        <input type="hidden" name="uses_js" value="false" />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Loading" : "Submit file"}
        </Button>
      </form>
    </>
  );
}

const uploadFileToS3 = async (event, agreement_id, router, selectedFile) => {
  event.preventDefault();

  try {
    const isUserSignedOut = (await sessionGetter.getSession()) === null;
    if (isUserSignedOut) {
      router.push("/welcome");
      return;
    }

    const getUrlResp = await fetch("/api/getfileuploadurl", {
      method: "POST",
      body: JSON.stringify({
        agreement_id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (getUrlResp.status !== 200)
      throw new Error("Get upload URL page returned non 200 status code");

    const { url: uploadUrl, fields: uploadFields } =
      (await getUrlResp.json()) as { url: string; fields: string[] };

    const formData = new FormData();
    Object.entries(uploadFields).forEach(([field, value]) => {
      formData.append(field, value);
    });
    formData.append("file", selectedFile);

    const resp = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (resp.status !== 204)
      throw new Error("Upload returned non 200 status code");
  } catch (err) {
    console.error(err);
    router.push("/500");
    return;
  }
  router.push(`/agreement/${agreement_id}/fileuploadsuccess`);
};

export default FileUploadPage;

export const getServerSideProps: GetServerSideProps<Notices> = async (
  context
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const userEmail = session?.user?.email || "";
  const agreementId = (context.params?.agreement_id as string) || "";

  const userAgreements = await getUserAgreements(userEmail);
  const agreementKeys = userAgreements.activeAgreements.map(
    (agreement) => agreement.agreement_id
  );

  if (userAgreements.selectedAgreement)
    agreementKeys.push(userAgreements.selectedAgreement.agreement_id);

  if (agreementKeys.indexOf(agreementId) === -1)
    return { redirect: { destination: "/403", permanent: false } };

  const notificationItems = await getNotifications();

  return {
    props: {
      notificationItems,
    },
  };
};
