import {
  DescribeExecutionCommand,
  DescribeExecutionCommandOutput,
  ExecutionStatus,
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";
import { AssumeRoleCommand, Credentials, STSClient } from "@aws-sdk/client-sts";
import type { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { getLogger } from "../../helpers/logging/logger";
import { authOptions } from "./auth/[...nextauth]";
const requestIp = require("request-ip");

const logger = getLogger("switchAgreement");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;

    const user_id = session.user?.email;
    const user_ip_address = requestIp.getClientIp(req);
    const { agreement_id } = req.body;

    const log_message = {
      user_id: user_id,
      ip_address: user_ip_address,
      agreement_id: agreement_id,
    };
    const child_logger = logger.child(log_message);

    if (typeof agreement_id !== "string") {
      return res
        .status(400)
        .json({ error: "agreement_id missing from request or is not string" });
    }
    const credentials = await getRoleCredentials();

    const inputCreds = {
      accessKeyId: credentials.AccessKeyId as string,
      secretAccessKey: credentials.SecretAccessKey as string,
      sessionToken: credentials.SessionToken as string,
    };

    const client = new SFNClient({
      region: "eu-west-2",
      credentials: inputCreds,
    });

    const switch_agreement_payload = JSON.stringify({
      user_id: user_id,
      agreement_id: agreement_id,
    });

    child_logger.debug({
      switch_agreement_payload: switch_agreement_payload,
    });

    const command = new StartExecutionCommand({
      stateMachineArn: process.env.SWITCH_AGREEMENT_ARN,
      input: switch_agreement_payload,
    });

    const { executionArn } = await client.send(command);

    if (executionArn === undefined) {
      child_logger.error({
        switched_agreement: "false",
        message: `User ${user_id} (${user_ip_address}) failed to switch to agreement ${agreement_id}.`,
      });

      throw new Error("Failed to invoke switch agreement process");
    }
    child_logger.debug({ sfnExecutionArn: executionArn });

    // Monitor for execution completion
    const executionResult = await monitorSfnExecution(client, executionArn);
    if (executionResult.success === true) {
      child_logger.info({
        switched_agreement: "true",
        message: `User ${user_id} (${user_ip_address}) switched to agreement ${agreement_id}.`,
      });
      const { redirect_url } = JSON.parse(executionResult.body);
      const STATUS_CODE_REDIRECT_AND_CHANGE_POST_TO_GET_REQUEST = 303;
      if (req.body.uses_js === "true") {
        return res.status(200).json({ redirect_url });
      } else {
        return res.redirect(
          STATUS_CODE_REDIRECT_AND_CHANGE_POST_TO_GET_REQUEST,
          redirect_url
        );
      }
    } else {
      child_logger.error({
        switched_agreement: "false",
        message: `User ${user_id} (${user_ip_address}) failed to switch to agreement ${agreement_id}.`,
        switchStatusCode: executionResult.statusCode,
        switchBody: executionResult.body,
      });
      return res.status(executionResult.statusCode).json(executionResult.body);
    }
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again later." });
  }
};

export default handler;

const monitorSfnExecution = async (
  client: SFNClient,
  executionArn: string,
  pollConfig: { interval: number; maxAttempts: number } = {
    interval: 1,
    maxAttempts: 300,
  }
): Promise<ExecutionResult> => {
  const monitorCommand = new DescribeExecutionCommand({
    executionArn: executionArn,
  });
  let executionDetails: DescribeExecutionCommandOutput;
  let executionState;

  for (let i = 0; i < pollConfig.maxAttempts; i++) {
    try {
      executionDetails = await client.send(monitorCommand);
    } catch (e) {
      return {
        success: false,
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to get sfn execution details",
          error: e,
        }),
      };
    }
    if (!executionDetails.executionArn) {
      return {
        success: false,
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to get sfn execution details",
        }),
      };
    }
    executionState = executionDetails.status;
    const executionOutput = executionDetails.output as string;
    switch (executionState) {
      case ExecutionStatus.RUNNING:
        await sleep(pollConfig.interval);
        break;
      case ExecutionStatus.SUCCEEDED:
        return parseExecutionOutput(executionOutput);
      case ExecutionStatus.ABORTED:
      case ExecutionStatus.FAILED:
      case ExecutionStatus.TIMED_OUT:
      default:
        return {
          success: false,
          statusCode: 500,
          body: JSON.stringify({
            message: `Step function execution reported a status of ${executionState}`,
          }),
        };
    }
  }

  return {
    success: false,
    statusCode: 500,
    body: "Process timed out waiting for the sfn execution to finish",
  };
};

const parseExecutionOutput = (
  executionOutputString: string
): ExecutionResult => {
  const executionOutput = JSON.parse(executionOutputString);
  // Check getSwitchLock status
  const getSwitchLockResult = executionOutput.getLockResult;
  if (getSwitchLockResult.statusCode !== 200) {
    return {
      success: false,
      statusCode: getSwitchLockResult.statusCode,
      body: getSwitchLockResult.body,
    };
  }
  // Check switchAgreement status
  const switchAgreementResult = executionOutput.switchAgreementResult;
  if (switchAgreementResult.statusCode !== 200) {
    return {
      success: false,
      statusCode: switchAgreementResult.statusCode,
      body: switchAgreementResult.body,
    };
  }
  // Check releaseSwitchLock status
  const releaseSwitchLockResult = executionOutput.releaseLockResult;
  if (releaseSwitchLockResult.statusCode !== 200) {
    return {
      success: false,
      statusCode: releaseSwitchLockResult.statusCode,
      body: releaseSwitchLockResult.body,
    };
  }
  return {
    success: true,
    statusCode: switchAgreementResult.statusCode,
    body: switchAgreementResult.body,
  };
};

type ExecutionResult = {
  success: boolean;
  statusCode: number;
  body: string;
};

const sleep = async (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const getRoleCredentials = async (): Promise<Credentials> => {
  const client = new STSClient({ region: "eu-west-2" });

  const command = new AssumeRoleCommand({
    RoleArn: process.env.SWITCH_AGREEMENT_ROLE_ARN,
    RoleSessionName: "portalSwitchAgreement",
    DurationSeconds: 900,
  });

  const response = await client.send(command);

  return response.Credentials as Credentials;
};
