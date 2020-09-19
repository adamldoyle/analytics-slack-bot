import SlackClient, { getChannelMap } from './slack';
import { getChannelStats, buildStatRanks, getGlobalStats } from './ranks';

jest.mock('./slack');

describe('ranks', () => {
  describe('getChannelStats', () => {
    it('fetches paginated results', async () => {
      SlackClient.paginate = jest.fn().mockImplementation(function* () {
        yield {
          messages: [{ user: 'user1' }, { user: 'user2' }, { user: 'user1' }],
        };
        yield { messages: [{ user: 'user3' }, { user: 'user2' }] };
      });
      const result = await getChannelStats('testChannelId');
      expect(result).toEqual({ user1: 2, user2: 2, user3: 1 });
    });

    it('null messages or null user are skipped', async () => {
      SlackClient.paginate = jest.fn().mockImplementation(function* () {
        yield {
          messages: [null, { user: 'user1' }, { user: null }],
        };
      });
      const result = await getChannelStats('testChannelId');
      expect(result).toEqual({ user1: 1 });
    });

    it('threaded messages are skipped', async () => {
      SlackClient.paginate = jest.fn().mockImplementation(function* () {
        yield {
          messages: [
            { user: 'user2', subtype: 'thread_broadcast' },
            { user: 'user1' },
            { user: 'user1', subtype: 'thread_broadcast' },
          ],
        };
      });
      const result = await getChannelStats('testChannelId');
      expect(result).toEqual({ user1: 1 });
    });
  });

  describe('getGlobalStats', () => {
    it('merges channel results', async () => {
      const mockChannelMap = {
        1: 'channel1',
        2: 'channel2',
      };
      getChannelMap.mockResolvedValue(mockChannelMap);
      SlackClient.paginate = jest
        .fn()
        .mockImplementation(function* (_, { channel }) {
          if (channel === '1') {
            yield {
              messages: [
                { user: 'user1' },
                { user: 'user2' },
                { user: 'user1' },
              ],
            };
            yield { messages: [{ user: 'user3' }, { user: 'user2' }] };
          } else if (channel === '2') {
            yield {
              messages: [
                { user: 'user3' },
                { user: 'user2' },
                { user: 'user4' },
              ],
            };
            yield { messages: [{ user: 'user1' }, { user: 'user2' }] };
          }
        });
      const { channelMap, globalStats } = await getGlobalStats();
      expect(channelMap).toEqual(mockChannelMap);
      expect(globalStats).toEqual({
        user1: 3,
        user2: 4,
        user3: 2,
        user4: 1,
      });
    });
  });

  describe('buildStatRanks', () => {
    it('sorts and builds ranks', () => {
      const stats = { user1: 2, user2: 1, user3: 3 };
      const users = {
        user1: { name: 'testUser1', bot: true },
        user2: { name: 'testUser2', bot: false },
        user3: { name: 'testUser3', bot: false },
      };
      const result = buildStatRanks(stats, users);
      expect(result).toEqual([
        {
          userId: 'user3',
          userName: 'testUser3',
          bot: false,
          messageCount: 3,
          rank: 1,
        },
        {
          userId: 'user1',
          userName: 'testUser1',
          bot: true,
          messageCount: 2,
          rank: 2,
        },
        {
          userId: 'user2',
          userName: 'testUser2',
          bot: false,
          messageCount: 1,
          rank: 3,
        },
      ]);
    });

    it('sorts by name when message count equal', () => {
      const stats = { user1: 2, user2: 2 };
      const users = {
        user1: { name: 'testUser1' },
        user2: { name: 'testUser2' },
      };
      const result = buildStatRanks(stats, users);
      expect(result).toEqual([
        { userId: 'user1', userName: 'testUser1', messageCount: 2, rank: 1 },
        { userId: 'user2', userName: 'testUser2', messageCount: 2, rank: 2 },
      ]);
    });
  });
});
