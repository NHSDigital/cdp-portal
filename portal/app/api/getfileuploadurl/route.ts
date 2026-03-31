import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Conditions } from '@aws-sdk/s3-presigned-post/dist-types/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getLogger } from '@/helpers/logging/logger';
const LOG = getLogger('getFileUploadURLAPI');

import { Logger } from 'pino';

import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import getUserAgreements from '@/services/getUserAgreements';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user_email = session?.user?.email;
    if (!user_email) {
      throw new Error('Failed to get user id from session');
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip_address = forwardedFor?.split(',')[0] ?? 'Unknown';
    const { agreement_id } = await request.json();

    const log_message = {
      user_email,
      ip_address,
      agreement_id,
    };
    const logger = LOG.child(log_message);

    if (!(await userIsPartOfAgreement(user_email, agreement_id, logger))) {
      return NextResponse.json(
        {
          error:
            'The user is not in the agreement they are trying to upload a file for.',
        },
        { status: 400 },
      );
    }

    const { url, fields } = await generateFileUploadURL(
      user_email,
      agreement_id,
      logger,
    );

    return NextResponse.json(
      {
        url,
        fields,
      },
      { status: 200 },
    );
  } catch (err) {
    LOG.error(err);
    NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}

const userIsPartOfAgreement = async (
  user_email: string,
  agreement_id: string,
  logger: Logger,
): Promise<boolean> => {
  try {
    const user_agreements = await getUserAgreements(user_email);
    const agreement_keys = user_agreements.activeAgreements.map(
      (agreement) => agreement.agreement_id,
    );

    if (user_agreements.selectedAgreement) {
      agreement_keys.push(user_agreements.selectedAgreement.agreement_id);
    }

    if (agreement_keys.indexOf(agreement_id) === -1) {
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Failed to verify if user is part of agreement');
    throw err;
  }
};

type Fields = Record<string, string>;

const generateFileUploadURL = async (
  user_email: string,
  agreement_id: string,
  logger: Logger,
): Promise<{ url: string; fields: Fields }> => {
  try {
    const key_prefix = `${agreement_id}/${user_email}/`;
    const s3_client = new S3Client({ region: 'eu-west-2' });
    const data_upload_bucket_name = process.env.DATA_UPLOAD_BUCKET_NAME || '';

    const acl = 'bucket-owner-full-control';
    const conditions: Conditions[] = [
      { acl },
      { bucket: data_upload_bucket_name },
      ['starts-with', '$key', key_prefix],
      [
        'content-length-range',
        1,
        Number(process.env.MAX_UPLOAD_FILE_SIZE_IN_BYTES),
      ],
    ];
    const post_fields = {
      acl,
    };

    const object_key = `${key_prefix}\${filename}`;

    const { url, fields } = await createPresignedPost(s3_client, {
      Bucket: data_upload_bucket_name,
      Key: object_key,
      Conditions: conditions,
      Fields: post_fields,
      Expires: 600, //Seconds before the presigned post expires.
    });

    return { url, fields };
  } catch (err) {
    logger.error('Failed to generate file upload url');
    throw err;
  }
};
