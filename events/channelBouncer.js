import SlackClient, { getUserMap, getChannelMembers } from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';
import { githubRepo } from './help';

export default async function handleChannelBouncer(payload) {
  const [
    { channelMap, globalStats },
    channelMembers,
    userMap,
  ] = await Promise.all([
    getGlobalStats(),
    getChannelMembers(payload.event.channel),
    getUserMap(),
  ]);
  const channel = channelMap[payload.event.channel];
  const ranks = buildStatRanks(globalStats, userMap);

  if (
    (!channel.startsWith('top_') && !channel.startsWith('bottom_')) ||
    (!channel.endsWith('_one') &&
      !channel.endsWith('_two') &&
      !channel.endsWith('_three') &&
      !channel.endsWith('_four'))
  ) {
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
  const ranksToInvite = [];
  ranks.forEach((rank) => {
    if (!rank.bot) {
      if (nonBotsSeen < rankAllowed) {
        nonBotsSeen++;
        if (!channelMembers.includes(rank.userId)) {
          ranksToInvite.push(rank);
        }
      } else if (channelMembers.includes(rank.userId)) {
        ranksToBounce.push(rank);
      }
    }
  });
  if (ranksToBounce.length === 0 && ranksToInvite.length === 0) {
    await SlackClient.chat.postMessage({
      text: 'Everything looks good here!',
      channel: payload.event.channel,
    });
  } else {
    if (ranksToInvite.length > 0) {
      await SlackClient.conversations.invite({
        users: ranksToInvite.map((rank) => rank.userId).join(','),
        channel: payload.event.channel,
      });
      await SlackClient.chat.postMessage({
        text: `Come on in, welcome to the party: ${ranksToInvite
          .map((rank) => rank.userName)
          .join(', ')}!`,
        channel: payload.event.channel,
      });
    }
    if (ranksToBounce.length > 0) {
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
}
