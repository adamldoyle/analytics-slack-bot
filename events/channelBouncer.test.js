import SlackClient, {
  getUserMap,
  getChannelMembers,
  getChannelMap,
} from '../libs/slack';
import { buildStatRanks, getGlobalStats } from '../libs/ranks';
import channelBouncerHandler from './channelBouncer';

jest.mock('../libs/slack');
jest.mock('../libs/ranks');

describe('channelBouncerHandler', () => {
  let mockGlobalStats;
  beforeEach(() => {
    jest.clearAllMocks();

    getChannelMap.mockResolvedValue({
      one: 'channelOne',
      two: 'top_whatever',
      three: 'top_three',
    });
    mockGlobalStats = {};
    getGlobalStats.mockResolvedValue({
      channelMap: null,
      globalStats: mockGlobalStats,
    });
    getChannelMembers.mockResolvedValue(['one', 'two']);
    getUserMap.mockResolvedValue({});
    buildStatRanks.mockReturnValue([]);
  });

  async function validateBadChannelName(payload, silent) {
    const response = await channelBouncerHandler(payload);
    if (silent) {
      expect(SlackClient.chat.postMessage).not.toBeCalled();
    } else {
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        text: expect.stringContaining("don't know how"),
        channel: payload.event.channel,
      });
    }
    expect(getChannelMap).toBeCalled();
    expect(getGlobalStats).not.toBeCalled();
    expect(getChannelMembers).not.toBeCalled();
    expect(getUserMap).not.toBeCalled();
    expect(buildStatRanks).not.toBeCalled();
  }

  it('skips channel if incorrect channel prefix', async () => {
    const payload = { event: { type: 'app_mention', channel: 'one' } };
    await validateBadChannelName(payload, false);
  });

  it('skips channel if incorrect channel prefix and is silent if not app_mention', async () => {
    const payload = {
      event: { type: 'member_joined_channel', channel: 'one' },
    };
    await validateBadChannelName(payload, true);
  });

  it('skips channel if incorrect channel suffix', async () => {
    const payload = { event: { type: 'app_mention', channel: 'two' } };
    await validateBadChannelName(payload, false);
  });

  it('skips channel if incorrect channel suffix and is silent if not app_mention', async () => {
    const payload = {
      event: { type: 'member_joined_channel', channel: 'two' },
    };
    await validateBadChannelName(payload, true);
  });

  it.only('', async () => {
    const payload = {
      event: { type: 'app_mention', channel: 'three' },
    };
    const response = await channelBouncerHandler(payload);
    expect(getChannelMap).toBeCalled();
    expect(getGlobalStats).toBeCalledWith(getChannelMap.mock.results[0].value);
    expect(getChannelMembers).toBeCalled();
    expect(getUserMap).toBeCalled();
    expect(buildStatRanks).toBeCalled();
  });
});
