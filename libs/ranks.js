import SlackClient, { getChannelMap } from './slack';

export async function getChannelStats(channelId) {
  let messages = [];
  for await (const response of SlackClient.paginate('conversations.history', {
    channel: channelId,
  })) {
    messages = messages.concat(response.messages);
  }
  const channelCounts = messages.reduce((acc, message) => {
    if (message && message.user && message.subtype !== 'thread_broadcast') {
      if (!acc[message.user]) {
        acc[message.user] = 0;
      }
      acc[message.user]++;
    }
    return acc;
  }, {});

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
