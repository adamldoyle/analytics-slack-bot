import AWS from 'aws-sdk';

const client = () => new AWS.DynamoDB.DocumentClient();

const wrapper = {
  get: (params) => client().get(params).promise(),
  put: (params) => client().put(params).promise(),
  query: (params) => client().query(params).promise(),
  scan: (params) => client().scan(params).promise(),
  update: (params) => client().update(params).promise(),
  delete: (params) => client().delete(params).promise(),
  transactGet: (params) => client().transactGet(params).promise(),
  transactWrite: (params) => client().transactWrite(params).promise(),
};

export async function getChannelMetrics(channelId) {
  const params = {
    TransactItems: [
      {
        Get: {
          TableName: process.env.channelUpdatesTableName,
          Key: {
            channelId,
          },
        },
      },
    ],
  };

  const result = await wrapper.transactGet(params);
  return result.Responses[0].Item;
}

/**
 * Updates timestamp for channel under specific conditions, to prevent race conditions:
 * - If previousTs is null, no matching row must exist first
 * - If previousTs is a timestamp, a matching row must exist with that timestamp
 * @param {string} channelId Slack channel id to record timestamp for
 * @param {number} currentTs New timestamp to use
 * @param {number} previousTs Previous timestamp, null if no timestamp
 */
export async function updateChannelMetrics(channelId, currentTs, previousTs) {
  const params = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.channelUpdatesTableName,
          ConditionExpression: previousTs
            ? 'updatedAt = :previousTs'
            : 'attribute_not_exists(channelId)',
          Item: {
            channelId,
            updatedAt: currentTs,
          },
          ExpressionAttributeValues: previousTs
            ? {
                ':previousTs': previousTs,
              }
            : undefined,
        },
      },
    ],
  };

  await wrapper.transactWrite(params);
}

export default wrapper;
