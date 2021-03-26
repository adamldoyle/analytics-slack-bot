import SlackClient, { getUserMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';
import { getChannelMetrics, updateChannelMetrics } from '../libs/dynamodb';

export default async function handleChannelRanks(payload) {
  const currentTs = Date.now() / 1000;
  const [channelMetrics, userMap] = await Promise.all([
    getChannelMetrics(payload.event.channel),
    getUserMap(),
  ]);
  const channelStats = await getChannelStats(payload.event.channel);
  await updateChannelMetrics(
    payload.event.channel,
    currentTs,
    channelMetrics?.updatedAt ?? null,
  );
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
    console.log(`Channel metrics:\n\n${JSON.stringify(channelMetrics)}`);
    console.log(`Channel ranks:\n\n${rankOutput}`);
  }
}
