import { Filter } from "./checkboxFilters";

export const USER_MANAGEMENT_FEATURE_FLAG = "user-management";
export const ADDING_USER_PERMISSIONS_REQUIRED = [
  "user_management.add_analyst",
  "user_management.add_user_manager",
];

export const VIEW_USER_DETAILS_PERMISSIONS_REQUIRED = [
  "user_management.get_agreement_user_details",
];

export const CHANGE_ACTIVATION_PERMISSIONS_REQUIRED = [
  "user_management.change_agreement_user_activation",
];

export const CHECKBOX_FILTERS: Filter[] = [
  {
    id: "role",
    name: "Roles",
    options: [
      { name: "Data Analyst", id: "analyst" },
      { name: "User Manager", id: "user-manager" },
      { name: "Both (Data Analyst and User Manager)", id: "both" },
    ],
  },
  {
    id: "status",
    name: "Status",
    options: [
      { name: "Pending induction", id: "pending-induction" },
      { name: "Activated", id: "activated" },
      { name: "Deactivated", id: "deactivated" },
    ],
  },
];
