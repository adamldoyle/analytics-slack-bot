import SlackClient, { getUserMap } from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';
import { getChannelMetrics, updateChannelMetrics } from '../libs/dynamodb';

export default async function handleGlobalRanks(payload) {
  const [channelMetrics, userMap] = await Promise.all([
    getChannelUpdatedMetrics(),
    getUserMap(),
  ]);
  const [{ channelMap, globalStats }] = await Promise.all([getGlobalStats()]);
  await updateChannelMetrics(channelMap, channelMetrics);
  const ranks = buildStatRanks(globalStats, userMap);
  const rankOutput = ranks
    .map(
      (rank) =>
        `${rank.rank}: ${rank.userName}${rank.bot ? '*' : ''} (${
          rank.messageCount
        } messages)`,
    )
    .join('\n');
  const channelOutput = Object.values(channelMap).join(', ');
  await SlackClient.chat.postMessage({
    text: `Global ranks:\n\n${rankOutput}\n\nChannels monitored: ${channelOutput}`,
    channel: payload.event.channel,
  });
}
