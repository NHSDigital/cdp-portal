import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-2" });

const tableName = process.env.TABLE_NAME;

export interface Notice {
  notification: string;
  colour: string;
  noticeId: string;
}

export interface Notices {
  notificationItems: Notice[];
}

const removeDuplicateNotifications = (notificationItems) => {
  return notificationItems.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.notification === value.notification)
  );
};

const getNotifications = async () => {
  const current_epoch = Math.round(Date.now() / 1000).toString();

  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: "#expiryPeriod >= :expiryPeriod",
    ExpressionAttributeNames: { "#expiryPeriod": "expiryPeriod" },
    ExpressionAttributeValues: {
      ":expiryPeriod": { N: current_epoch },
    },
  });

  const response = await client.send(command);
  const current = Date.now() / 1000;
  const colour_list = ["red", "blue", "yellow"];

  if (!response.Items) {
    response.Items = [];
  }

  let notificationItems = response.Items.filter(function (notice) {
    // @ts-ignore
    return parseInt(notice.startPeriod.N) < current;
  }).map(function (notice) {
    let colour = notice.colour.S as string;

    // Sets default colour to blue
    if (!colour_list.includes(colour)) {
      colour = "blue";
    }

    return {
      notification: notice.notification.S as string,
      colour: colour as string,
      noticeId: notice.noticeId.S as string,
    };
  });

  notificationItems = removeDuplicateNotifications(notificationItems);

  return notificationItems;
};

export default getNotifications;
