import SlackClient from './slack';
import { WebAPICallResult } from '@slack/web-api';

interface Message {
  user?: string;
  subtype?: string;
}

interface ConversationsHistoryResult extends WebAPICallResult {
  messages: Message[];
}

export async function getChannelStats(channelId) {
  let messages: Message[] = [];
  for await (const response of SlackClient.paginate('conversations.history', {
    channel: channelId,
  }) as AsyncIterable<ConversationsHistoryResult>) {
    messages = messages.concat(response.messages);
  }
  const channelCounts = messages.reduce((acc, message) => {
    if (message && message.user && message.subtype !== 'thread_broadcast') {
      if (!acc[message.user]) {
        acc[message.user] = 0;
      }
      acc[message.user]++;
    }
    return acc;
  }, {});

  return channelCounts;
}

export function buildStatRanks(stats, users) {
  return Object.keys(stats)
    .map((userId) => ({
      userId,
      userName: users[userId],
      messageCount: stats[userId],
      rank: -1,
    }))
    .sort((a, b) =>
      a.messageCount > b.messageCount
        ? -1
        : a.messageCount < b.messageCount
        ? 1
        : a.userName.localeCompare(b.userName),
    )
    .map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
}
