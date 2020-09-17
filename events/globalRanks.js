import SlackClient, { getUserMap, getChannelMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';

export default async function handleGlobalRanks(payload) {
  const [channelMap, userMap] = await Promise.all([
    getChannelMap(),
    getUserMap(),
  ]);
  const channelsStats = await Promise.all(
    Object.keys(channelMap).map((channelId) => getChannelStats(channelId)),
  );
  const globalStats = channelsStats.reduce((acc, channelStats) => {
    Object.keys(channelStats).forEach((userId) => {
      acc[userId] = channelStats[userId] + (acc[userId] || 0);
    });
    return acc;
  }, {});
  const ranks = buildStatRanks(globalStats, userMap);
  const rankOutput = ranks
    .map(
      (rank) =>
        `${rank.rank}: ${rank.userName}${rank.bot ? '*' : ''} (${
          rank.messageCount
        } messages)`,
    )
    .join('\n');
  const channelOutput = Object.keys(channelMap)
    .map((channelId) => channelMap[channelId])
    .join(', ');
  await SlackClient.chat.postMessage({
    text: `Global ranks:\n\n${rankOutput}\n\nChannels monitored: ${channelOutput}`,
    channel: payload.event.channel,
  });
  return true;
}
