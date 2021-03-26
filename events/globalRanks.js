import SlackClient, { getUserMap } from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';

export default async function handleGlobalRanks(payload) {
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
  const channelOutput = Object.values(channelMap).join(', ');
  if (!process.env.IS_LOCAL) {
    await SlackClient.chat.postMessage({
      text: `Global ranks:\n\n${rankOutput}\n\nChannels monitored: ${channelOutput}`,
      channel: payload.event.channel,
    });
  } else {
    console.log(
      `Global ranks:\n\n${rankOutput}\n\nChannels monitored: ${channelOutput}`,
    );
  }
}
