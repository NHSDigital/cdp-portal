import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";
import { getLogger } from "../../helpers/logging/logger";

const logger = getLogger("switchAgreement");

const client = new S3Client({ region: "eu-west-2" });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;
    const user_email = session.user?.email;

    const object_key = `${req.body.agreementId}/${user_email}/${req.body.fileName}`;

    const input = {
      Bucket: process.env.DATA_UPLOAD_BUCKET_NAME,
      Prefix: object_key,
    };

    const command = new ListObjectsCommand(input);

    const response = await client.send(command);

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key === object_key)
          return res.status(400).json({ message: "File already exists" });
      }
    }
    return res.status(200).json({ message: "File does not exist" });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "An unknown error occurred" });
  }
};

export default handler;
