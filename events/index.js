import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';
import channelBouncerHandler from './channelBouncer';
import { handleSource, handleHelp, handleVersion } from './help';
import mentionMessages from './mentionMessages';

export default async function handleEvent(payload) {
  if (payload.event.type === 'app_mention') {
    const text = payload.event.text;
    if (text.includes(mentionMessages.CHANNEL_RANKS)) {
      return channelRanksHandler(payload);
    } else if (text.includes(mentionMessages.GLOBAL_RANKS)) {
      return globalRanksHandler(payload);
    } else if (text.includes(mentionMessages.SOURCE)) {
      return handleSource(payload);
    } else if (text.includes(mentionMessages.HELP)) {
      return handleHelp(payload);
    } else if (text.includes(mentionMessages.CHANNEL_BOUNCER)) {
      return channelBouncerHandler(payload);
    } else if (text.includes(mentionMessages.VERSION)) {
      return handleVersion(payload);
    }
  }
  if (payload.event.type === 'member_joined_channel') {
    return channelBouncerHandler(payload);
  }
}
