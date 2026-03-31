export const NATIONAL_SERVICE_DESK_EMAIL = 'ssd.nationalservicedesk@nhs.net';
export const NATIONAL_SERVICE_DESK_TELEPHONE = '0300 303 5035';
export const SDE_INPUT_CHECKS_EMAIL = 'england.sde.input-checks@nhs.net';

export enum FeatureFlags {
  PASSWORD_SETUP_FLOW = 'password_setup_flow',
  INDUCTION = 'induction',
  USER_MANAGEMENT = 'user-management',
}

export enum CookieNames {
  CONFIRMED_EMAIL = 'sde-confirmed-email',
  INDUCTION = 'sde-induction-form',
  ADD_USER_FORM = 'sde-add-user-form',
  MANAGE_USERS_SUCCESS_MESSAGE = 'sde-manage-users-success-message',
}

export enum Permissions {
  SEE_ALL_AGREEMENTS = 'portal.see_all_agreements',
  MAINTENANCE_ACCESS = 'portal.maintenance_access',
  OPEN_AGREEMENT = 'vdi.open_agreement',
  UPLOAD_FILE = 'data_in.upload_file',
  GET_AGREEMENT_USERS = 'user_management.get_agreement_users',
  ADD_ANALYST = 'user_management.add_analyst',
  ADD_USER_MANAGER = 'user_management.add_user_manager',
  GET_AGREEMENT_USER_DETAILS = 'user_management.get_agreement_user_details',
  CHANGE_AGREEMENT_USER_ACTIVATION = 'user_management.change_agreement_user_activation',
}

export const Actions = {
  SEE_ALL_AGREEMENTS: [Permissions.SEE_ALL_AGREEMENTS],
  MAINTENANCE_ACCESS: [Permissions.MAINTENANCE_ACCESS],
  GET_AGREEMENT_USERS: [Permissions.GET_AGREEMENT_USERS],
  ADD_NEW_USER: [Permissions.ADD_ANALYST, Permissions.ADD_USER_MANAGER],
  CHANGE_USER_ROLE: [Permissions.ADD_ANALYST, Permissions.ADD_USER_MANAGER], // intentionally same perms as add user
  VIEW_USER_DETAILS: [Permissions.GET_AGREEMENT_USER_DETAILS],
  CHANGE_USER_ACTIVATION: [Permissions.CHANGE_AGREEMENT_USER_ACTIVATION],
};
