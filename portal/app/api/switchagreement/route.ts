import {
  DescribeExecutionCommand,
  DescribeExecutionCommandOutput,
  ExecutionStatus,
  SFNClient,
  StartExecutionCommand,
} from '@aws-sdk/client-sfn';
import { AssumeRoleCommand, Credentials, STSClient } from '@aws-sdk/client-sts';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Logger } from 'pino';

import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { getLogger } from '@/helpers/logging/logger';

const LOG = getLogger('switchAgreement');

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get('Content-Type');
  if (contentType === 'application/x-www-form-urlencoded') {
    const formData = await request.formData();
    return {
      agreement_id: formData.get('agreement_id') || '',
      open_using: formData.get('open_using') || '',
      uses_js: formData.get('uses_js') === 'true',
    };
  }
  const jsonBody = await request.json();
  return {
    agreement_id: jsonBody.agreement_id || '',
    open_using: jsonBody.open_using || '',
    uses_js: jsonBody.uses_js === 'true',
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user_id = session?.user?.email;
    if (!user_id) {
      throw new Error('Failed to get user id from session');
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip_address = forwardedFor?.split(',')[0] ?? 'Unknown';
    const { agreement_id, open_using, uses_js } =
      await parseRequestBody(request);

    const log_message = {
      user_id,
      ip_address,
      agreement_id,
    };
    const logger = LOG.child(log_message);

    const sfn_client = await initialiseSFNClient(logger);

    const executionArn = await startSFNExecution(
      sfn_client,
      user_id,
      agreement_id,
      logger,
    );

    const executionResult = await monitorSfnExecution(sfn_client, executionArn);

    return evaluateExecutionResult(
      executionResult,
      open_using,
      uses_js,
      logger,
    );
  } catch (err) {
    LOG.error(err);
    NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}

const initialiseSFNClient = async (logger: Logger): Promise<SFNClient> => {
  try {
    const sts_client = new STSClient({ region: 'eu-west-2' });

    const command = new AssumeRoleCommand({
      RoleArn: process.env.SWITCH_AGREEMENT_ROLE_ARN,
      RoleSessionName: 'portalSwitchAgreement',
      DurationSeconds: 900,
    });

    const response = await sts_client.send(command);

    const credentials = response.Credentials as Credentials;

    const inputCreds = {
      accessKeyId: credentials.AccessKeyId as string,
      secretAccessKey: credentials.SecretAccessKey as string,
      sessionToken: credentials.SessionToken as string,
    };

    const sfn_client = new SFNClient({
      region: 'eu-west-2',
      credentials: inputCreds,
    });

    return sfn_client;
  } catch (err) {
    logger.error('Failed to initalise SFNClient');
    throw err;
  }
};

const startSFNExecution = async (
  sfn_client: SFNClient,
  user_id: string,
  agreement_id: string,
  logger: Logger,
): Promise<string> => {
  try {
    const switch_agreement_payload = JSON.stringify({
      user_id,
      agreement_id,
    });
    logger.debug({ switch_agreement_payload });

    const command = new StartExecutionCommand({
      stateMachineArn: process.env.SWITCH_AGREEMENT_ARN,
      input: switch_agreement_payload,
    });

    const { executionArn } = await sfn_client.send(command);

    if (executionArn === undefined) {
      throw new Error('Failed to invoke switch agreement process');
    }

    logger.debug({ sfnExecutionArn: executionArn });
    return executionArn;
  } catch (err) {
    logger.error({
      switched_agreement: 'false',
      message: `Failed to switch to agreement`,
    });
    throw err;
  }
};

type ExecutionResult = {
  success: boolean;
  statusCode: number;
  body: string;
};

const monitorSfnExecution = async (
  client: SFNClient,
  executionArn: string,
  pollConfig: { interval: number; maxAttempts: number } = {
    interval: 1,
    maxAttempts: 300,
  },
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
          message: 'Failed to get sfn execution details',
          error: e,
        }),
      };
    }
    if (!executionDetails.executionArn) {
      return {
        success: false,
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to get sfn execution details',
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
    body: 'Process timed out waiting for the sfn execution to finish',
  };
};

const sleep = async (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const parseExecutionOutput = (
  executionOutputString: string,
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

const evaluateExecutionResult = (
  executionResult: ExecutionResult,
  open_using: string,
  uses_js: boolean,
  logger: Logger,
): NextResponse => {
  if (executionResult.success === true) {
    logger.info({
      switched_agreement: 'true',
      message: `Successfully switch agreement`,
      mode: open_using,
    });
    const { redirect_url } = JSON.parse(executionResult.body);
    if (uses_js) {
      return NextResponse.json({ redirect_url }, { status: 200 });
    } else {
      return NextResponse.redirect(redirect_url, 303);
    }
  } else {
    logger.error({
      switched_agreement: 'false',
      message: `Failed to switch agreement.`,
      switchStatusCode: executionResult.statusCode,
      switchBody: executionResult.body,
    });
    return NextResponse.json(executionResult.body, {
      status: executionResult.statusCode,
    });
  }
};
