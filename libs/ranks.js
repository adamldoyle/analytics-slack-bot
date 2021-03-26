import SlackClient, { getChannelMap } from './slack';
import { getChannelMetrics, updateChannelMetrics } from './dynamodb';

export async function getChannelStats(channelId) {
  const currentTs = Date.now() / 1000;
  const previousChannelMetrics = await getChannelMetrics(channelId);

  let messages = [];
  for await (const response of SlackClient.paginate('conversations.history', {
    channel: channelId,
    oldest: previousChannelMetrics.lastUpdatedAt,
    latest: currentTs,
  })) {
    messages = messages.concat(response.messages);
  }

  const newCounts = messages.reduce((acc, message) => {
    if (message && message.user && message.subtype !== 'thread_broadcast') {
      if (!acc[message.user]) {
        acc[message.user] = 0;
      }
      acc[message.user]++;
    }
    return acc;
  }, {});

  const channelCounts = await updateChannelMetrics(
    channelId,
    previousChannelMetrics,
    newCounts,
    currentTs,
  );

  return channelCounts;
}

export async function getGlobalStats(channelMapParam = null) {
  const channelMap = channelMapParam || (await getChannelMap());
  const channelsStats = await Promise.all(
    Object.keys(channelMap).map((channelId) => getChannelStats(channelId)),
  );
  const globalStats = channelsStats.reduce((acc, channelStats) => {
    Object.keys(channelStats).forEach((userId) => {
      acc[userId] = channelStats[userId] + (acc[userId] || 0);
    });
    return acc;
  }, {});
  return { channelMap, globalStats };
}

export function buildStatRanks(stats, users) {
  return Object.keys(stats)
    .map((userId) => ({
      userId,
      userName: users[userId].name,
      bot: users[userId].bot,
      messageCount: stats[userId],
      rank: -1,
    }))
    .sort((a, b) =>
      a.messageCount > b.messageCount
        ? -1
        : a.messageCount < b.messageCount
        ? 1
        : a.userName.localeCompare(b.userName),
    )
    .map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
}
