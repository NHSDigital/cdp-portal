import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { getLogger } from "../../helpers/logging/logger";
import { authOptions } from "./auth/[...nextauth]";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import getUserAgreements from "../../services/getUserAgreements";
import { S3Client } from "@aws-sdk/client-s3";
import { Conditions } from "@aws-sdk/s3-presigned-post/dist-types/types";

const requestIp = require("request-ip");

const logger = getLogger("switchAgreement");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;

    const userEmail = session.user?.email || "";
    const user_ip_address = requestIp.getClientIp(req);
    const { agreement_id: agreementId } = req.body;

    const log_message = {
      user_email: userEmail,
      ip_address: user_ip_address,
      agreement_id: agreementId,
    };
    const child_logger = logger.child(log_message);

    child_logger.debug("User requested url to upload file");

    const userAgreements = await getUserAgreements(userEmail);
    const agreementKeys = userAgreements.activeAgreements.map(
      (agreement) => agreement.agreement_id
    );

    if (userAgreements.selectedAgreement)
      agreementKeys.push(userAgreements.selectedAgreement.agreement_id);

    if (agreementKeys.indexOf(agreementId) === -1)
      return res.status(400).json({
        message:
          "The user is not in the agreement they are trying to upload a file for.",
      });

    const keyPrefix = `${agreementId}/${userEmail}/`;
    const client = new S3Client({ region: "eu-west-2" });
    const bucket = process.env.DATA_UPLOAD_BUCKET_NAME || "";
    const acl = "bucket-owner-full-control";
    const conditions: Conditions[] = [
      { acl: acl },
      { bucket: bucket },
      ["starts-with", "$key", keyPrefix],
      ["content-length-range", 1, 1048576],
    ];
    const postFields = {
      acl: acl,
    };
    const key = `${keyPrefix}\${filename}`;
    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: key,
      Conditions: conditions,
      Fields: postFields,
      Expires: 600, //Seconds before the presigned post expires.
    });

    return res.status(200).json({
      url,
      fields,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "An unknown error occurred" });
  }
};

export default handler;
