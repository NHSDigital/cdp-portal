'use server';

import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import hasPermissions from 'app/services/hasPermissions';
import callLambdaWithFullErrorChecking from 'app/shared/callLambda';
import { logAndError } from 'app/shared/common';
import { getLoggerAndSession } from 'app/shared/logging';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Logger } from 'pino';
import { z } from 'zod';

import { Actions, CookieNames, FeatureFlags } from '@/config/constants';

const LOGGER_NAME = 'createUser';

const AGREEMENTS_TO_SKIP_DATABRICKS: string[] = ['review_file'];

interface CreateBaseUser {
  user_email: string;
  first_name: string;
  last_name: string;
  logger: Logger;
}

export interface CreateOneUser {
  user_to_add_email: string;
  first_name: string;
  last_name: string;
  role: string;
  agreement_id: string;
  logger: Logger;
  deps?: {
    createBaseUser: typeof createBaseUser;
    addRoleToUserInAgreement: typeof addRoleToUserInAgreement;
    addUserToAgreementAccountGroupInDatabricks: typeof addUserToAgreementAccountGroupInDatabricks;
  };
}

export interface AddRoleToUserInAgreement {
  user_email: string;
  agreement_id: string;
  role_name: string;
  fleet_type?: string;
  logger: Logger;
  email_type: 'NEW_USER' | 'ROLE_CHANGE' | null;
}

interface AddUserToAgreementAccountGroupInDatabricks {
  user_email: string;
  agreement_id: string;
  logger: Logger;
}

const CreateUserInputSchema = z.object({
  agreement_id: z.string().min(1),
  user_to_add_email: z.string().min(1),
  user_to_add_role: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export async function createOneUserServerActionNoJS(
  agreement_id: string,
  _previous_state: Record<string, unknown>,
  form_data: FormData,
  deps = { createOneUserCommon },
) {
  const { logger } = await getLoggerAndSession(LOGGER_NAME);
  const user_to_add_email = form_data.get('email') as string;
  const user_to_add_role = form_data.get('role') as string;
  const first_name = form_data.get('first_name') as string;
  const last_name = form_data.get('last_name') as string;
  const final_confirm = form_data.get('final_confirm');

  if (!final_confirm) {
    return { error: 'You must confirm that these details are correct' };
  }

  try {
    await deps.createOneUserCommon(
      agreement_id,
      user_to_add_email,
      user_to_add_role,
      first_name,
      last_name,
    );

    const cookie_store = cookies();
    (await cookie_store).set(
      CookieNames.MANAGE_USERS_SUCCESS_MESSAGE,
      `${form_data.get('first_name')} ${form_data.get(
        'last_name',
      )} added successfully`,
      { expires: Date.now() + 30 * 1000 },
    );
    (await cookie_store).set(CookieNames.ADD_USER_FORM, '', { maxAge: 0 }); // expire the add user form cookie

    redirect(`/agreement/${agreement_id}/manage-users`);
  } catch (error) {
    logger.error(error);
    return { error: 'UNEXPECTED_ERROR' };
  }
}

export async function createOneUserCommon(
  agreement_id: string,
  user_to_add_email: string,
  user_to_add_role: string,
  first_name: string,
  last_name: string,
  deps = { createOneUser },
) {
  const validated = CreateUserInputSchema.safeParse({
    agreement_id,
    user_to_add_email,
    user_to_add_role,
    first_name,
    last_name,
  });

  if (!validated.success) {
    console.error(validated.error.format());
    throw new Error('Invalid input');
  }

  const { logger, session } = await getLoggerAndSession(LOGGER_NAME, {
    user_to_add: {
      user_email: user_to_add_email,
      role: user_to_add_role,
      agreement_id,
    },
  });
  try {
    logger.info('Add user requested.');

    logger.info('Starting create user process for one user');

    const hasfeatureEnabled = await hasFeatureFlagEnabled({
      featureFlagName: FeatureFlags.USER_MANAGEMENT,
    });

    if (!hasfeatureEnabled) logAndError(logger, 'This feature is disabled');

    const userHasPermission = await hasPermissions({
      permissions_required: Actions.ADD_NEW_USER,
      agreement_id,
      user_email: session.user.email,
      target_user: user_to_add_email,
    });

    if (!userHasPermission) {
      logAndError(
        logger,
        'Requesting user does not have permission to add new users, or email input by user is a data wrangler or support admin',
      );
    }

    await deps.createOneUser({
      user_to_add_email,
      first_name,
      last_name,
      role: user_to_add_role,
      agreement_id,
      logger,
    });

    logger.info('Add user success.');
  } catch (err) {
    logger.error(err);
    throw new Error('Something went wrong');
  }
}

export async function createOneUser({
  user_to_add_email,
  first_name,
  last_name,
  role,
  agreement_id,
  logger,
  deps = {
    createBaseUser,
    addRoleToUserInAgreement,
    addUserToAgreementAccountGroupInDatabricks,
  },
}: CreateOneUser) {
  await deps.createBaseUser({
    user_email: user_to_add_email,
    first_name,
    last_name,
    logger: logger,
  });

  let role_name: string;
  let fleet_type: string | undefined;

  if (role == 'Analyst' || role == 'Both') {
    role_name =
      agreement_id == 'review_file' ? 'BasicAgreementAccess' : 'Analyst';
    fleet_type = agreement_id == 'review_file' ? 'review_file' : 'default';

    await deps.addRoleToUserInAgreement({
      user_email: user_to_add_email,
      agreement_id,
      role_name,
      fleet_type,
      logger: logger,
      email_type: role == 'Both' ? null : 'NEW_USER',
    });
  }

  if (role == 'UserManager' || role == 'Both') {
    await deps.addRoleToUserInAgreement({
      user_email: user_to_add_email,
      agreement_id,
      role_name: 'UserManager',
      logger: logger,
      email_type: 'NEW_USER',
    });
  }

  if (!AGREEMENTS_TO_SKIP_DATABRICKS.includes(agreement_id)) {
    await deps.addUserToAgreementAccountGroupInDatabricks({
      user_email: user_to_add_email,
      agreement_id,
      logger: logger,
    });
  }

  logger.info('Finished create user process');
}

export async function createBaseUser({ logger, ...rest }: CreateBaseUser) {
  return await callLambdaWithFullErrorChecking({
    function_name: process.env.CREATE_BASE_USER_ARN as string,
    raw_payload: rest,
    logger,
    log_result: true,
  });
}

export async function addRoleToUserInAgreement({
  logger,
  fleet_type,
  ...rest
}: AddRoleToUserInAgreement) {
  const raw_payload = rest;
  if (fleet_type) raw_payload['fleet_type'] = fleet_type;

  return await callLambdaWithFullErrorChecking({
    function_name: process.env.ADD_ROLE_TO_USER_IN_AGREEMENT_ARN as string,
    raw_payload,
    logger,
    log_result: true,
  });
}

export async function addUserToAgreementAccountGroupInDatabricks({
  logger,
  ...rest
}: AddUserToAgreementAccountGroupInDatabricks) {
  const raw_payload = rest;

  return await callLambdaWithFullErrorChecking({
    function_name: process.env
      .ADD_USER_TO_AGREEMENT_ACCOUNT_GROUP_IN_DATABRICKS_ARN as string,
    raw_payload,
    logger,
    log_result: true,
  });
}
