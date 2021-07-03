import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';
import channelBouncerHandler from './channelBouncer';
import {
  handleSource,
  handleHelp,
  handleVersion,
  handleUnmonitored,
  handleGender,
} from './help';
import mentionMessages from './mentionMessages';

const GENDER_WORDS = ['girl', 'woman', 'she', 'her', 'boy', 'man', 'he', 'him', 'robot'];

function genderMatch(text) {
  const textWords = text.toLowerCase().split(' ');
  return GENDER_WORDS.find((word) => textWords.includes(word));
}

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
    } else if (text.includes(mentionMessages.UNMONITORED)) {
      return handleUnmonitored(payload);
    } else if (genderMatch(text)) {
      return handleGender(payload, genderMatch(text));
    }
  }
  if (payload.event.type === 'member_joined_channel') {
    return channelBouncerHandler(payload);
  }
}
