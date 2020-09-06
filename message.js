import handler from './libs/handler-lib';
import SlackClient, { verifyRequest } from './libs/slack-lib';

export const main = handler(async (event, context) => {
  const payload = JSON.parse(event.body);

  if (payload.type === 'debug') {
    await SlackClient.chat.postMessage({
      text: 'This is a debug message',
      channel: payload.channel,
    });
  }

  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }
  if (payload.type === 'url_verification') {
    return { challenge: payload.challenge };
  }
  if (
    payload.type === 'event_callback' &&
    payload.event.type === 'app_mention'
  ) {
    const text = payload.event.text;
    if (text.includes('what is my global message rank')) {
      await SlackClient.chat.postMessage({
        text: `<@${payload.event.user}>: your global message rank is 2`,
        channel: payload.event.channel,
      });
    }
  }

  return true;
});
