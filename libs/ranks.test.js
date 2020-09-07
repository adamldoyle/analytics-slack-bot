import SlackClient from './slack';
import { getChannelStats, buildStatRanks } from './ranks';

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
  });

  describe('buildStatRanks', () => {
    it('sorts and buils ranks', () => {
      const stats = { user1: 2, user2: 1, user3: 3 };
      const users = {
        user1: 'testUser1',
        user2: 'testUser2',
        user3: 'testUser3',
      };
      const result = buildStatRanks(stats, users);
      expect(result).toEqual([
        { userId: 'user3', userName: 'testUser3', messageCount: 3, rank: 1 },
        { userId: 'user1', userName: 'testUser1', messageCount: 2, rank: 2 },
        { userId: 'user2', userName: 'testUser2', messageCount: 1, rank: 3 },
      ]);
    });
  });
});
