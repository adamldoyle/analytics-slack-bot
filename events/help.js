import { sendMessage, getChannelMap, getAllChannelsMap } from '../libs/slack';
import mentionMessages from './mentionMessages';
import packageJson from '../package.json';

export const githubRepo = 'https://github.com/adamldoyle/analytics-slack-bot';

export async function handleSource(payload) {
  await sendMessage({
    text: `Source: ${githubRepo}`,
    channel: payload.event.channel,
  });
}

export async function handleHelp(payload) {
  await sendMessage({
    text: `Available commands: ${Object.values(mentionMessages)
      .map((message) => `"${message}"`)
      .join(', ')}`,
    channel: payload.event.channel,
  });
}

export async function handleVersion(payload) {
  await sendMessage({
    text: `Current version: ${packageJson.version}`,
    channel: payload.event.channel,
  });
}

export async function handleUnmonitored(payload) {
  const [monitoredChannels, allChannels] = await Promise.all([
    getChannelMap(),
    getAllChannelsMap(),
  ]);
  const unmonitoredChannels = Object.entries(allChannels)
    .filter((entry) => !monitoredChannels[entry[0]])
    .map((entry) => entry[1])
    .sort((a, b) => a.localeCompare(b))
    .join(', ');
  await sendMessage({
    text: `Unmonitored channels: ${unmonitoredChannels}`,
    channel: payload.event.channel,
  });
}

export async function handleGender(payload, match) {
  await sendMessage({
    text: `Not a ${match}`,
    channel: payload.event.channel,
  });
}
