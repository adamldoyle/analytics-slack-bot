import { WebClient } from '@slack/web-api';
import { verifyRequestSignature } from '@slack/events-api';
import SlackClient, {
  verifyRequest,
  getChannelMap,
  getUserMap,
  getChannelMembers,
} from './slack';

jest.mock('@slack/web-api');
jest.mock('@slack/events-api');

describe('slack', () => {
  let oldEnv;

  beforeEach(() => {
    jest.resetAllMocks();
    oldEnv = process.env;
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  describe('verifyRequest', () => {
    it('passes along values from headers', () => {
      process.env.SLACK_SIGNING_SECRET = 'testSecret';
      const event = {
        headers: {
          'X-Slack-Request-Timestamp': 'testTimestamp',
          'X-Slack-Signature': 'testSignature',
        },
        body: 'testBody',
      };
      verifyRequestSignature.mockReturnValue('testReturn');
      const result = verifyRequest(event);
      expect(result).toEqual('testReturn');
      expect(verifyRequestSignature).toBeCalledWith({
        signingSecret: 'testSecret',
        requestSignature: 'testSignature',
        requestTimestamp: 'testTimestamp',
        body: 'testBody',
      });
    });
  });

  describe('getChannelMap', () => {
    it('converts to map', async () => {
      const mockConversations = jest.fn().mockResolvedValue({
        channels: [
          { id: 'chan1', name: 'Channel1' },
          { id: 'chan2', name: 'Channel2' },
        ],
      });
      WebClient.mockImplementation(() => {
        return {
          users: {
            conversations: mockConversations,
          },
        };
      });
      const result = await getChannelMap();
      expect(result).toEqual({ chan1: 'Channel1', chan2: 'Channel2' });
    });
  });

  describe('getUserMap', () => {
    it('converts to map', async () => {
      const mockUsers = jest.fn().mockResolvedValue({
        members: [
          { id: 'user1', name: 'User1', is_bot: true },
          { id: 'user2', name: 'User2', is_bot: false },
        ],
      });
      WebClient.mockImplementation(() => {
        return {
          users: {
            list: mockUsers,
          },
        };
      });
      const result = await getUserMap();
      expect(result).toEqual({
        user1: { id: 'user1', name: 'User1', bot: true },
        user2: { id: 'user2', name: 'User2', bot: false },
      });
    });
  });

  describe('getChannelMembers', () => {
    it('returns members', async () => {
      const mockMembers = jest.fn().mockResolvedValue({
        members: ['1', '2', '3'],
      });
      WebClient.mockImplementation(() => {
        return {
          conversations: {
            members: mockMembers,
          },
        };
      });
      const result = await getChannelMembers('1');
      expect(result).toEqual(['1', '2', '3']);
      expect(mockMembers).toBeCalledWith({ channel: '1' });
    });
  });
});
