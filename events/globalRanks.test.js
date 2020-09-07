import SlackClient, { getUserMap, getChannelMap } from '../libs/slack';
import { getChannelStats, buildStatRanks } from '../libs/ranks';
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
    const mockUserMap = { 1: 'user1', 2: 'user2', 3: 'user3' };
    const mockChannelStats1 = { 1: 3, 2: 1 };
    const mockChannelStats2 = { 1: 2, 3: 2 };

    getChannelMap.mockResolvedValue(mockChannelMap);
    getUserMap.mockResolvedValue(mockUserMap);
    getChannelStats
      .mockResolvedValueOnce(mockChannelStats1)
      .mockResolvedValueOnce(mockChannelStats2);
    buildStatRanks.mockReturnValue([
      { rank: 1, userName: 'user1', messageCount: 5 },
      { rank: 2, userName: 'user3', messageCount: 2 },
      { rank: 3, userName: 'user2', messageCount: 1 },
    ]);

    const response = await handleGlobalRanks(payload);

    expect(getChannelMap).toBeCalled();
    expect(getUserMap).toBeCalled();
    expect(getChannelStats).toHaveBeenNthCalledWith(1, 'testChannel1');
    expect(getChannelStats).toHaveBeenNthCalledWith(2, 'testChannel2');
    expect(buildStatRanks).toBeCalledWith({ 1: 5, 2: 1, 3: 2 }, mockUserMap);
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      channel: 'testChannel',
      text:
        'Global ranks:\n\n1: user1 (5 messages)\n2: user3 (2 messages)\n3: user2 (1 messages)',
    });
    expect(response).toBeTruthy();
  });
});
