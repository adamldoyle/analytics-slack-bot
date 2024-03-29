import { WebClient } from '@slack/web-api';
import { verifyRequestSignature } from '@slack/events-api';

const token = process.env.SLACK_TOKEN;
const SlackClient = new WebClient(token);
export default SlackClient;

export function verifyRequest(event) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const requestTimestamp = event.headers['X-Slack-Request-Timestamp'];
  const requestSignature = event.headers['X-Slack-Signature'];
  const body = event.body;
  return verifyRequestSignature({
    signingSecret,
    requestSignature,
    requestTimestamp,
    body,
  });
}

export async function getChannelMap() {
  // Using WebClient explicitly here instead of SlackToken to aid with testing
  const response = await new WebClient(token).users.conversations({
    types: 'public_channel,private_channel',
  });
  return response.channels.reduce((acc, channel) => {
    acc[channel.id] = channel.name;
    return acc;
  }, {});
}

export async function getAllChannelsMap() {
  const response = await new WebClient(token).conversations.list();
  return response.channels.reduce((acc, channel) => {
    acc[channel.id] = channel.name;
    return acc;
  }, {});
}

export async function getUserMap() {
  const response = await new WebClient(token).users.list();
  return response.members.reduce((acc, user) => {
    acc[user.id] = { id: user.id, name: user.name, bot: user.is_bot };
    return acc;
  }, {});
}

export async function getChannelMembers(channelId) {
  const response = await new WebClient(token).conversations.members({
    channel: channelId,
  });
  return response.members;
}

export async function sendMessage(payload) {
  if (!process.env.IS_LOCAL) {
    return new WebClient(token).chat.postMessage(payload);
  } else {
    console.log('Sending slack message (skipped due to local execution):');
    console.log(payload);
  }
}
