import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';

export default async function handleEvent(payload) {
  if (payload.event.type === 'app_mention') {
    const text = payload.event.text;
    if (text.includes('channel ranks')) {
      return channelRanksHandler(payload);
    }
    if (text.includes('global ranks')) {
      return globalRanksHandler(payload);
    }
  }
}
