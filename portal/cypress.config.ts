import { defineConfig } from "cypress";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const aws_env =
  process.env.BUILD_ENV === "local" ? "dev" : process.env.BUILD_ENV;

if (aws_env === "prod") throw new Error("Cannot run e2e tests on prod");

// using the AWS SDK for JS, update the user's row with induction status
const dynamodb = new DynamoDBClient({
  credentials: fromIni({
    profile: `orchestration_${aws_env}`,
  }),
  region: "eu-west-2",
});

const MAINTENANCE_MODE_TRUE_EXCLUDE_SPEC = [
  "**/induction/**",
  "**/sde_portal/**",
  "**/user_management/**",
  "**/accessibility/**",
  "**/maintenance_page_false**",
  "**/password_setup_flow**",
];
const MAINTENANCE_MODE_FALSE_EXCLUDE_SPEC = ["**/maintenance_page_true**"];

export default defineConfig({
  e2e: {
    excludeSpecPattern:
      process.env.MAINTENANCE_MODE == "true"
        ? MAINTENANCE_MODE_TRUE_EXCLUDE_SPEC
        : MAINTENANCE_MODE_FALSE_EXCLUDE_SPEC,
    env: {},
    setupNodeEvents(on, config) {
      on("task", {
        async updateUserInductionStatus({
          user_email,
          done_induction,
          induction_timestamp = 1718285936,
        }: {
          user_email: string;
          done_induction: boolean;
          induction_timestamp: number;
        }) {
          const base_params = {
            TableName: "Agreements",
            Key: {
              PK: { S: `user-${user_email}` },
              SK: { S: `user-${user_email}` },
            },
          };

          let params;
          if (done_induction) {
            params = {
              ...base_params,
              UpdateExpression: "SET induction = :induction",
              ExpressionAttributeValues: {
                ":induction": {
                  M: {
                    attempts: {
                      L: [
                        {
                          M: {
                            passed: { BOOL: true },
                            timestamp: { N: induction_timestamp.toString() },
                            attemped_questions: {
                              L: [{ N: "1" }, { N: "2" }, { N: "3" }],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            };
          } else {
            params = {
              ...base_params,
              UpdateExpression: "REMOVE induction",
            };
          }

          await dynamodb.send(new UpdateItemCommand(params));

          return null;
        },
        async updateUserPasswordResetGuid({
          guid,
          user_email,
          is_expired = false,
        }: {
          guid: string;
          user_email: string;
          is_expired?: boolean;
        }) {
          const guid_timestamp = is_expired
            ? "100000"
            : Math.floor(Date.now() / 1000).toString();
          const update_params = {
            TableName: "Agreements",
            Key: {
              PK: { S: `user-${user_email}` },
              SK: { S: `user-${user_email}` },
            },
            UpdateExpression: "SET account_setup_guid = :account_setup_guid",
            ExpressionAttributeValues: {
              ":account_setup_guid": {
                L: [
                  {
                    M: {
                      guid: { S: guid },
                      timestamp: {
                        N: guid_timestamp,
                      }, // time in seconds
                    },
                  },
                ],
              },
            },
          };

          await dynamodb.send(new UpdateItemCommand(update_params));

          return null;
        },
      });
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    viewportHeight: 900,
    viewportWidth: 1500,
  },

  retries: {
    runMode: 2,
    openMode: 1,
  },
});
