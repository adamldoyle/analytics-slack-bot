import SlackClient from './slack';

export async function getChannelStats(channelId) {
  let messages = [];
  for await (const response of SlackClient.paginate('conversations.history', {
    channel: channelId,
  })) {
    messages = messages.concat(response.messages);
  }
  const channelCounts = messages.reduce((acc, message) => {
    if (message && message.user && !message.thread_ts) {
      if (!acc[message.user]) {
        acc[message.user] = 0;
      }
      acc[message.user]++;
    }
    return acc;
  }, {});

  return channelCounts;
}

export function buildStatRanks(stats, users) {
  return Object.keys(stats)
    .map((userId) => ({
      userId,
      userName: users[userId],
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
