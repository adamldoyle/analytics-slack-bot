import SlackClient, { getUserMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';

export default async function handleChannelRanks(payload) {
  const [userMap, channelStats] = await Promise.all([
    getUserMap(),
    getChannelStats(payload.event.channel),
  ]);
  const ranks = buildStatRanks(channelStats, userMap);
  const rankOutput = ranks
    .map(
      (rank) =>
        `${rank.rank}: ${rank.userName}${rank.bot ? '*' : ''} (${
          rank.messageCount
        } messages)`,
    )
    .join('\n');
  if (!process.env.IS_LOCAL) {
    await SlackClient.chat.postMessage({
      text: `Channel ranks:\n\n${rankOutput}`,
      channel: payload.event.channel,
    });
  } else {
    console.log(`Channel ranks:\n\n${rankOutput}`);
  }
}
