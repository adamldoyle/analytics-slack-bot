import SlackClient, { getUserMap, getChannelMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';
import { githubRepo } from './help';

export default async function handleChannelBouncer(payload) {
  const [channelStats, channelMap, userMap] = await Promise.all([
    getChannelStats(payload.event.channel),
    getChannelMap(),
    getUserMap(),
  ]);
  const channel = channelMap[payload.event.channel];
  const ranks = buildStatRanks(channelStats, userMap);
  if (channel === 'top_four') {
    let nonBotsSeen = 0;
    const ranksToBounce = [];
    ranks.forEach((rank) => {
      if (!rank.bot) {
        if (nonBotsSeen < 4) {
          nonBotsSeen++;
        } else {
          ranksToBounce.push(rank);
        }
      }
    });
    if (ranksToBounce.length === 0) {
      await SlackClient.chat.postMessage({
        text: 'Everything looks good here!',
        channel: payload.event.channel,
      });
    } else {
      await SlackClient.chat.postMessage({
        text: `Come on now, you know you don\'t belong here: ${ranksToBounce
          .map((rank) => rank.userName)
          .join(', ')}!`,
        channel: payload.event.channel,
      });
      await Promise.all(
        ranksToBounce.map((rank) =>
          SlackClient.conversations.kick({
            user: rank.userId,
            channel: payload.event.channel,
          }),
        ),
      );
    }
  } else {
    await SlackClient.chat.postMessage({
      text: `I don't know how to manage this channel, perhaps a PR would help? ${githubRepo}`,
      channel: payload.event.channel,
    });
  }
}
