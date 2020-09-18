import SlackClient, { getUserMap } from '../libs/slack';
import { getGlobalStats, buildStatRanks } from '../libs/ranks';
import handleGlobalRanks from './globalRanks';

jest.mock('../libs/slack');
jest.mock('../libs/ranks');

describe('handleGlobalRanks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats and sends stats to Slack', async () => {
    const payload = {
      event: {
        channel: 'testChannel',
      },
    };
    const mockChannelMap = {
      testChannel1: 'testChannel1',
      testChannel2: 'testChannel2',
    };
    const mockGlobalStats = { 1: 5, 2: 1, 3: 2 };
    const mockUserMap = { 1: 'user1', 2: 'user2', 3: 'user3' };

    getGlobalStats.mockResolvedValue({
      globalStats: mockGlobalStats,
      channelMap: mockChannelMap,
    });
    getUserMap.mockResolvedValue(mockUserMap);
    buildStatRanks.mockReturnValue([
      { rank: 1, userName: 'user1', bot: true, messageCount: 5 },
      { rank: 2, userName: 'user3', bot: false, messageCount: 2 },
      { rank: 3, userName: 'user2', bot: false, messageCount: 1 },
    ]);

    const response = await handleGlobalRanks(payload);

    expect(getUserMap).toBeCalled();
    expect(getGlobalStats).toBeCalled();
    expect(buildStatRanks).toBeCalledWith({ 1: 5, 2: 1, 3: 2 }, mockUserMap);
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      channel: 'testChannel',
      text:
        'Global ranks:\n\n1: user1* (5 messages)\n2: user3 (2 messages)\n3: user2 (1 messages)\n\nChannels monitored: testChannel1, testChannel2',
    });
    expect(response).toBeTruthy();
  });
});
