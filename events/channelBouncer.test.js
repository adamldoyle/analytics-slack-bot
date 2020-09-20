import SlackClient, {
  getUserMap,
  getChannelMembers,
  getChannelMap,
} from '../libs/slack';
import { buildStatRanks, getGlobalStats } from '../libs/ranks';
import channelBouncerHandler from './channelBouncer';
const { buildStatRanks: actualBuildStatRanks } = jest.requireActual(
  '../libs/ranks',
);

jest.mock('../libs/slack');
jest.mock('../libs/ranks');

describe('channelBouncerHandler', () => {
  let mockChannelMap;
  let mockGlobalStats;
  let mockUserMap;
  beforeEach(() => {
    jest.clearAllMocks();

    mockChannelMap = {
      one: 'channelOne',
      two: 'top_whatever',
      three: 'top_three',
    };
    getChannelMap.mockResolvedValue(mockChannelMap);
    mockGlobalStats = { one: 1, two: 2, three: 3, four: 4 };
    getGlobalStats.mockResolvedValue({
      channelMap: null,
      globalStats: mockGlobalStats,
    });
    getChannelMembers.mockResolvedValue(['one', 'two', 'three', 'four']);
    mockUserMap = {
      one: { name: 'user1' },
      two: { name: 'user2' },
      three: { name: 'user3' },
      four: { name: 'user4' },
    };
    getUserMap.mockResolvedValue(mockUserMap);
    mockStatRanks();
  });

  function mockStatRanks() {
    buildStatRanks.mockReturnValue(
      actualBuildStatRanks(mockGlobalStats, mockUserMap),
    );
  }

  async function validateBadChannelName(payload, silent) {
    await channelBouncerHandler(payload);
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

  async function validateMocks(eventType = 'app_mention') {
    mockStatRanks();

    const payload = {
      event: { type: eventType, channel: 'three' },
    };
    await channelBouncerHandler(payload);

    expect(getChannelMap).toBeCalled();
    expect(getGlobalStats).toBeCalledWith(
      await getChannelMap.mock.results[0].value,
    );
    expect(getChannelMembers).toBeCalledWith('three');
    expect(getUserMap).toBeCalled();
    expect(buildStatRanks).toBeCalledWith(
      (await getGlobalStats.mock.results[0].value).globalStats,
      await getUserMap.mock.results[0].value,
    );
  }

  function didNoOp() {
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      text: 'Everything looks good here!',
      channel: 'three',
    });
  }

  function didNotNoOp() {
    expect(SlackClient.chat.postMessage).not.toBeCalledWith({
      text: 'Everything looks good here!',
      channel: 'three',
    });
  }

  function didKick(users) {
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      text: `Come on now, you know you don't belong here: ${users
        .map((userId) => mockUserMap[userId].name)
        .join(', ')}!`,
      channel: 'three',
    });

    expect(SlackClient.conversations.kick).toBeCalledTimes(users.length);
    users.forEach((userId) => {
      expect(SlackClient.conversations.kick).toBeCalledWith({
        user: userId,
        channel: 'three',
      });
    });
  }

  function didNotKick() {
    expect(SlackClient.conversations.kick).not.toBeCalled();
  }

  function didInvite(users) {
    expect(SlackClient.chat.postMessage).toBeCalledWith({
      text: `Come on in, welcome to the party: ${users
        .map((userId) => mockUserMap[userId].name)
        .join(', ')}!`,
      channel: 'three',
    });

    expect(SlackClient.conversations.invite).toBeCalledWith({
      users: users.join(','),
      channel: 'three',
    });
  }

  function didNotInvite() {
    expect(SlackClient.conversations.invite).not.toBeCalled();
  }

  it("does nothing when it doesn't need to", async () => {
    getChannelMembers.mockResolvedValue(['two', 'three', 'four']);

    await validateMocks();
    didNoOp();
    didNotInvite();
    didNotKick();
  });

  it('kicks users outside of required rank', async () => {
    await validateMocks();
    didNotNoOp();
    didNotInvite();
    didKick(['one']);
  });

  it('ignores bots when kicking', async () => {
    mockUserMap.three.bot = true;

    await validateMocks();
    didNoOp();
    didNotInvite();
    didNotKick();
  });

  it('invites users inside of required rank but not in channel', async () => {
    getChannelMembers.mockResolvedValue(['three', 'four']);
    mockUserMap.top = { name: 'top' };
    mockGlobalStats.top = 5;

    await validateMocks();
    didNotNoOp();
    didInvite(['top']);
    didNotKick();
  });

  it('ignores bots when inviting', async () => {
    getChannelMembers.mockResolvedValue(['three', 'four']);
    mockUserMap.top = { name: 'top', bot: true };
    mockGlobalStats.top = 5;

    await validateMocks();
    didNotNoOp();
    didInvite(['two']);
    didNotKick();
  });

  it('can kick and invite at same time', async () => {
    getChannelMembers.mockResolvedValue(['two', 'three', 'four']);
    mockUserMap.top = { name: 'top' };
    mockGlobalStats.top = 5;

    await validateMocks();
    didNotNoOp();
    didInvite(['top']);
    didKick(['two']);
  });

  it('bottom reverses kicks', async () => {
    mockChannelMap.three = 'bottom_three';

    await validateMocks();
    didNotNoOp();
    didNotInvite();
    didKick(['four']);
  });

  it('bottom reverses invites', async () => {
    mockChannelMap.three = 'bottom_three';
    getChannelMembers.mockResolvedValue(['one', 'two']);
    mockUserMap.bottom = { name: 'bottom' };
    mockGlobalStats.bottom = 0;

    await validateMocks();
    didNotNoOp();
    didInvite(['bottom']);
    didNotKick();
  });

  it('skips no-op message when not app_mention', async () => {
    getChannelMembers.mockResolvedValue(['two', 'three', 'four']);

    await validateMocks('member_joined_channel');
    didNotNoOp();
    didNotInvite();
    didNotKick();
  });

  it('skips invites when not app_mention', async () => {
    getChannelMembers.mockResolvedValue(['three', 'four']);
    mockUserMap.top = { name: 'top' };
    mockGlobalStats.top = 5;

    await validateMocks('member_joined_channel');
    didNotNoOp();
    didNotInvite();
    didNotKick();
  });

  it('kicks as normal even if not app_mention', async () => {
    await validateMocks('member_joined_channel');
    didNotNoOp();
    didNotInvite();
    didKick(['one']);
  });
});
