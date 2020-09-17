import SlackClient, { getUserMap, getChannelMap, getChannelMembers } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';
import { githubRepo } from './help';

export default async function handleChannelBouncer(payload) {
  const [channelStats, channelMap, channelMembers, userMap] = await Promise.all([
    getChannelStats(payload.event.channel),
    getChannelMap(),
    getChannelMembers(payload.event.channel),
    getUserMap(),
  ]);
  const channel = channelMap[payload.event.channel];
  const ranks = buildStatRanks(channelStats, userMap);

  if (channel !== 'top_four' && channel !== 'bottom_three') {
    await SlackClient.chat.postMessage({
      text: `I don't know how to manage this channel, perhaps a PR would help? ${githubRepo}`,
      channel: payload.event.channel,
    });
    return;
  }

  if (channel.startsWith('bottom_')) {
    ranks.reverse();
  }

  let rankAllowed = 100;
  // This is stupid, whatever
  if (channel.endsWith('_one')) {
    rankAllowed = 1;
  } else if (channel.endsWith('_two')) {
    rankAllowed = 2;
  } else if (channel.endsWith('_three')) {
    rankAllowed = 3;
  } else if (channel.endsWith('_four')) {
    rankAllowed = 4;
  }

  let nonBotsSeen = 0;
  const ranksToBounce = [];
  ranks.forEach((rank) => {
    if (!rank.bot) {
      if (nonBotsSeen < rankAllowed) {
        nonBotsSeen++;
      } else if (channelMembers.includes(rank.userId)) {
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
}
