import SlackClient, { getUserMap } from '../libs/slack';
import { getChannelStats, buildChannelRanks } from '../libs/ranks';

export default async function handleChannelRanks(payload) {
  const [channelStats, userMap] = await Promise.all([
    getChannelStats(payload.event.channel),
    getUserMap(),
  ]);
  const ranks = buildChannelRanks(channelStats, userMap);
  const rankOutput = ranks
    .map(
      (rank) =>
        `${rank.rank}: ${rank.userName} (${rank.messageCount} messages)`,
    )
    .join('\n');
  await SlackClient.chat.postMessage({
    text: `Channel ranks:\n\n${rankOutput}`,
    channel: payload.event.channel,
  });
  return true;
}
