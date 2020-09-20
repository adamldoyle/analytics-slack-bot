import SlackClient, { getUserMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';
import handleChannelRanks from './channelRanks';

jest.mock('../libs/slack');
jest.mock('../libs/ranks');

describe('handleChannelRanks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats and sends stats to Slack', async () => {
    const payload = {
      event: {
        channel: 'testChannel',
      },
    };
    const mockUserMap = { 1: 'user1' };
    const mockChannelStats = { 1: 3 };
    getUserMap.mockResolvedValue(mockUserMap);
    getChannelStats.mockResolvedValue(mockChannelStats);
    buildStatRanks.mockReturnValue([
      { rank: 1, userName: 'user1', bot: true, messageCount: 3 },
      { rank: 2, userName: 'user2', bot: false, messageCount: 2 },
    ]);
    await handleChannelRanks(payload);
    expect(getUserMap).toBeCalled();
    expect(getChannelStats).toBeCalledWith('testChannel');
    expect(buildStatRanks).toBeCalledWith(mockChannelStats, mockUserMap);
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      channel: 'testChannel',
      text: 'Channel ranks:\n\n1: user1* (3 messages)\n2: user2 (2 messages)',
    });
  });
});
