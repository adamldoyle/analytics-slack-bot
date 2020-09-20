import SlackClient, {
  getUserMap,
  getChannelMembers,
  getChannelMap,
} from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';
import { githubRepo } from './help';
import wordsToNumbers from 'words-to-numbers';

const re = /^(?<positions>top|bottom)_(?<rankAllowed>[a-z_]+)$/;

export default async function handleChannelBouncer(payload) {
  const channelMap = await getChannelMap();
  const channel = channelMap[payload.event.channel];

  // Doesn't match string or words can't be converted to numbers
  const match = channel.match(re);
  if (
    !match ||
    wordsToNumbers(match.groups.rankAllowed) === match.groups.rankAllowed
  ) {
    if (payload.event.type === 'app_mention') {
      await SlackClient.chat.postMessage({
        text: `I don't know how to manage this channel, perhaps a PR would help? ${githubRepo}`,
        channel: payload.event.channel,
      });
    }
    return;
  }

  const [{ globalStats }, channelMembers, userMap] = await Promise.all([
    getGlobalStats(channelMap),
    getChannelMembers(payload.event.channel),
    getUserMap(),
  ]);

  const ranks = buildStatRanks(globalStats, userMap);
  const { position, rankAllowed } = match.groups;

  if (position === 'bottom') {
    ranks.reverse();
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
    if (payload.event.type === 'app_mention') {
      await SlackClient.chat.postMessage({
        text: 'Everything looks good here!',
        channel: payload.event.channel,
      });
    }
  } else {
    if (payload.event.type === 'app_mention') {
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
