import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Logger } from "pino";
import { logAndError } from "./common";

const encoder = new TextEncoder();
const client = new LambdaClient({ region: "eu-west-2" });

interface CallLambda {
  function_name: string;
  raw_payload: { [key: string]: any };
  logger: Logger;
  log_result?: boolean;
}

export default async function callLambdaWithFullErrorChecking({
  function_name,
  raw_payload,
  logger,
  log_result = false,
}: CallLambda) {
  const child_logger = logger.child({ function_name });
  child_logger.info(`Calling lambda`);

  const resultJson = await callLambdaWithoutFullErrorChecking({
    function_name,
    raw_payload,
    logger: child_logger,
    log_result,
  });

  if (
    typeof resultJson?.statusCode !== "number" ||
    resultJson.statusCode < 200 ||
    resultJson.statusCode >= 300
  ) {
    logAndError(
      child_logger,
      `Lambda ${function_name} returned a non 200 status code`
    );
  }

  child_logger.info("Lambda call successful");

  return resultJson;
}

interface InvokeLambda {
  function_name: string;
  raw_payload: { [key: string]: any };
  logger: Logger;
  log_result?: boolean;
}

export async function callLambdaWithoutFullErrorChecking({
  function_name,
  raw_payload,
  logger,
  log_result = false,
}: InvokeLambda) {
  /*
   * You may use this function if the lambda has a non standard return structure
   * and so the error checking above does not work
   * e.g: the change_user_activation lambda doesn't return status code so you have to use this function
   */
  const command = new InvokeCommand({
    FunctionName: function_name,
    Payload: encoder.encode(JSON.stringify(raw_payload)),
  });

  const res = await client.send(command);
  if (function_name.endsWith("change_user_activation"))
    logger.error(
      { StatusCode: res.StatusCode, FunctionError: res.FunctionError },
      "RES!!!"
    );
  const { Payload, StatusCode, FunctionError } = res;

  if (!StatusCode || StatusCode < 200 || StatusCode >= 300) {
    logAndError(
      logger,
      `Lambda ${function_name} gave a non 2xx status code, this is an error`
    );
  }
  if (!Payload) {
    logAndError(
      logger,
      `Lambda ${function_name} returned no payload, this is an error`
    );
  }
  if (FunctionError) {
    logger.error({ FunctionError, function_name });
    logAndError(logger, `Lambda ${function_name} returned a FunctionError`);
  }

  const result = Buffer.from(Payload).toString();
  const resultJson = JSON.parse(result);

  if (log_result) logger.info({ resultJson });

  return resultJson;
}
