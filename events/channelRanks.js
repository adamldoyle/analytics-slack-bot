import { getUserMap, sendMessage } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';

export default async function handleChannelRanks(payload) {
  await sendMessage({
    text: 'Calculating, please hold...',
    channel: payload.event.channel,
  });

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

  await sendMessage({
    text: `Channel ranks:\n\n${rankOutput}`,
    channel: payload.event.channel,
  });
}
