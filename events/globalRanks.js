import { getUserMap, sendMessage } from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';

export default async function handleGlobalRanks(payload) {
  await sendMessage({
    text: 'Calculating, please hold...',
    channel: payload.event.channel,
  });

  const [userMap, { channelMap, globalStats }] = await Promise.all([
    getUserMap(),
    getGlobalStats(),
  ]);
  const ranks = buildStatRanks(globalStats, userMap);
  const rankOutput = ranks
    .map(
      (rank) =>
        `${rank.rank}: ${rank.userName}${rank.bot ? '*' : ''} (${
          rank.messageCount
        } messages)`,
    )
    .join('\n');
  const channelOutput = Object.values(channelMap)
    .sort((a, b) => a.localeCompare(b))
    .join(', ');
  await sendMessage({
    text: `Global ranks:\n\n${rankOutput}\n\nChannels monitored: ${channelOutput}`,
    channel: payload.event.channel,
  });
}
