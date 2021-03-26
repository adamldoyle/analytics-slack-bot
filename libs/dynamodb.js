import AWS from 'aws-sdk';

const client = () => new AWS.DynamoDB.DocumentClient();

const wrapper = {
  get: (params) => client().get(params).promise(),
  put: (params) => client().put(params).promise(),
  query: (params) => client().query(params).promise(),
  scan: (params) => client().scan(params).promise(),
  update: (params) => client().update(params).promise(),
  delete: (params) => client().delete(params).promise(),
  transactWrite: (params) => client().transactWrite(params).promise(),
};

export async function getChannelMetrics(channelId) {
  const channelParams = {
    TableName: process.env.channelUpdatesTableName,
    Key: {
      channelId,
    },
  };

  const userParams = {
    TableName: process.env.messageCountsTableName,
    KeyConditionExpression: 'channelId = :channelId',
    ExpressionAttributeValues: {
      ':channelId': channelId,
    },
  };

  const [channelResult, userResult] = await Promise.all([
    wrapper.get(channelParams),
    wrapper.query(userParams),
  ]);

  return {
    lastUpdatedAt: channelResult.Item?.updatedAt ?? 0,
    userMetrics: userResult.Items,
  };
}

export async function updateChannelMetrics(
  channelId,
  previousMetrics,
  newStats,
  currentTs,
) {
  const messagesByUser = previousMetrics.userMetrics.reduce((acc, userItem) => {
    acc[userItem.userId] = (acc[userItem.userId] ?? 0) + userItem.messages;
    return acc;
  }, newStats);

  const params = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.channelUpdatesTableName,
          ConditionExpression: previousMetrics.lastUpdatedAt
            ? 'updatedAt = :previousTs'
            : 'attribute_not_exists(channelId)',
          Item: {
            channelId,
            updatedAt: currentTs,
          },
          ExpressionAttributeValues: previousMetrics.lastUpdatedAt
            ? {
                ':previousTs': previousMetrics.lastUpdatedAt,
              }
            : undefined,
        },
      },
      ...Object.keys(messagesByUser).map((userId) => ({
        Put: {
          TableName: process.env.messageCountsTableName,
          Item: {
            channelId,
            userId,
            messages: messagesByUser[userId],
            updatedAt: currentTs,
          },
        },
      })),
    ],
  };

  await wrapper.transactWrite(params);

  return messagesByUser;
}

export default wrapper;
