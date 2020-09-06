import handler from './libs/handler';
import SlackClient, { verifyRequest, getUserMap } from './libs/slack';
import { getChannelStats, buildChannelRanks } from './libs/ranks';

export const main = handler(async (event, context) => {
  const payload = JSON.parse(event.body);

  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  if (payload.type === 'url_verification') {
    return { challenge: payload.challenge };
  }
  if (
    payload.type === 'event_callback' &&
    payload.event.type === 'app_mention'
  ) {
    const text = payload.event.text;
    if (text.includes('channel ranks')) {
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
        .join('\\n');
      await SlackClient.chat.postMessage({
        text: `Channel ranks:\n\n${rankOutput}`,
        channel: payload.event.channel,
      });
    }
  }

  return true;
});
