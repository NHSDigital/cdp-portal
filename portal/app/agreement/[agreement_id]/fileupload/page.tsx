import React from 'react';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import FileUploadClientSidePage from './_components/FileUploadClientSidePage';

interface FileUploadPageProps {
  params: { agreement_id: string };
}

async function FileUploadPage({
  params: { agreement_id },
}: FileUploadPageProps) {
  const whiteLabelValues = getWhiteLabelValues();

  return (
    <FileUploadClientSidePage
      agreementId={agreement_id}
      max_file_size_in_bytes={Number(process.env.MAX_UPLOAD_FILE_SIZE_IN_BYTES)}
      whiteLabelValues={whiteLabelValues}
    />
  );
}

export default FileUploadPage;
