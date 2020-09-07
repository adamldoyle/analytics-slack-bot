import channelRanksHandler from './channelRanks';

export default async function handleEvent(payload) {
  if (payload.event.type === 'app_mention') {
    const text = payload.event.text;
    if (text.includes('channel ranks')) {
      return channelRanksHandler(payload);
    }
  }
}
