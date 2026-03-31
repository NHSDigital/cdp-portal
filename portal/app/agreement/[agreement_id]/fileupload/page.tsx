import React from 'react';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import FileUploadClientSidePage from './_components/FileUploadClientSidePage';

interface FileUploadPageProps {
  params: Promise<{ agreement_id: string }>;
}

async function FileUploadPage({ params }: FileUploadPageProps) {
  const { agreement_id } = await params;
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
