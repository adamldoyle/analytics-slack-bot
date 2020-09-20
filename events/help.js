import SlackClient from '../libs/slack';
import mentionMessages from './mentionMessages';
import packageJson from '../package.json';

export const githubRepo = 'https://github.com/adamldoyle/analytics-slack-bot';

export async function handleSource(payload) {
  await SlackClient.chat.postMessage({
    text: `Source: ${githubRepo}`,
    channel: payload.event.channel,
  });
}

export async function handleHelp(payload) {
  await SlackClient.chat.postMessage({
    text: `Available commands: ${Object.values(mentionMessages)
      .map((message) => `"${message}"`)
      .join(', ')}`,
    channel: payload.event.channel,
  });
}

export async function handleVersion(payload) {
  await SlackClient.chat.postMessage({
    text: `Current version: ${packageJson.version}`,
    channel: payload.event.channel,
  });
}
