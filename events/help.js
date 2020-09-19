import SlackClient from '../libs/slack';
import mentionMessages from './mentionMessages';

export const githubRepo = 'https://github.com/adamldoyle/analytics-slack-bot';

export async function handleSource(payload) {
  await SlackClient.chat.postMessage({
    text: `Source: ${githubRepo}`,
    channel: payload.event.channel,
  });
  return true;
}

export async function handleHelp(payload) {
  await SlackClient.chat.postMessage({
    text: `Available commands: ${Object.values(mentionMessages)
      .map((message) => `"${message}"`)
      .join(', ')}`,
    channel: payload.event.channel,
  });
  return true;
}
