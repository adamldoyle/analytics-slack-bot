import AWS, { DynamoDB } from 'aws-sdk';

const client = () => new AWS.DynamoDB.DocumentClient();

const wrapper = {
  get: (params) => client().get(params).promise(),
  put: (params) => client().put(params).promise(),
  query: (params) => client().query(params).promise(),
  scan: (params) => client().scan(params).promise(),
  update: (params) => client().update(params).promise(),
  delete: (params) => client().delete(params).promise(),
};

export async function getChannelMetrics() {
  const params = {
    TableName: process.env.channelUpdatesTableName,
  };

  const result = await wrapper.scan(params);
  return result.Items;
}

async function updateSingleChannelMetrics(channelId) {
  const params = {
    TableName: process.env.channelUpdatesTableName,
    ConditionExpression: `updatedAt = :previousUpdatedAt`,
    Item: {
      channelId,
      updatedAt: Date.now(),
    },
  };

  await DynamoDB.put(params);
}

export async function updateChannelMetrics(channelMap, channelMetrics) {
  await Promise.all(
    Object.keys(channelMap).map((channelId) =>
      updateSingleChannelMetrics(channelId),
    ),
  );
}

export default wrapper;
