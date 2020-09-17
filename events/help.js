import SlackClient from '../libs/slack';

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
    text:
      'Available commands: "channel ranks", "global ranks", "source", "help"',
    channel: payload.event.channel,
  });
  return true;
}
