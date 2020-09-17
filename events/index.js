import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';
import channelBouncerHandler from './channelBouncer';
import { handleSource, handleHelp } from './help';

export default async function handleEvent(payload) {
  if (payload.event.type === 'app_mention') {
    const text = payload.event.text;
    if (text.includes('channel ranks')) {
      return channelRanksHandler(payload);
    }
    if (text.includes('global ranks')) {
      return globalRanksHandler(payload);
    }
    if (text.includes('source')) {
      return handleSource(payload);
    }
    if (text.includes('help')) {
      return handleHelp(payload);
    }
    if (text.includes('channel bouncer')) {
      return channelBouncerHandler(payload);
    }
  }
}
