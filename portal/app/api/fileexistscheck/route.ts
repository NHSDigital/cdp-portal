import { ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getLogger } from '@/helpers/logging/logger';
const LOG = getLogger('fileExistsCheckAPI');

import { authOptions } from '@/app/api/auth/[...nextauth]/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user_email = session?.user?.email;
    if (!user_email) {
      throw new Error('Failed to get user id from session');
    }

    const { agreementId, fileName } = await request.json();

    const object_key = `${agreementId}/${user_email}/${fileName}`;
    const input = {
      Bucket: process.env.DATA_UPLOAD_BUCKET_NAME,
      Prefix: object_key,
    };

    const command = new ListObjectsCommand(input);

    const s3_client = new S3Client({ region: 'eu-west-2' });
    const response = await s3_client.send(command);

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key === object_key)
          return NextResponse.json(
            { message: 'File already exists' },
            { status: 400 },
          );
      }
    }

    return NextResponse.json(
      { message: 'File does not exist' },
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
