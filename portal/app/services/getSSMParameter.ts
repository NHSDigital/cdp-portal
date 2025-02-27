import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { getLogger } from "../../helpers/logging/logger";

const client = new SSMClient({ region: "eu-west-2" });
const logger = getLogger("getSSMParameter");

interface GetSSMParameterProps {
  parameterName: string;
  withDecryption?: boolean;
}

export default async function getSSMParameter({
  parameterName,
  withDecryption,
}: GetSSMParameterProps): Promise<string | undefined> {
  try {
    const input = {
      Name: parameterName,
    };
    if (withDecryption) {
      input["WithDecryption"] = withDecryption;
    }
    const command = new GetParameterCommand(input);

    logger.debug({
      state: "Fetching SSM parameter",
      payload: input,
    });

    const { Parameter } = await client.send(command);

    if (Parameter === undefined) {
      throw new Error("Parameter not found");
    }

    return Parameter.Value;
  } catch (e) {
    console.error({
      state: "Failed to fetch SSM parameter",
      error: e,
    });
    return undefined;
  }
}
