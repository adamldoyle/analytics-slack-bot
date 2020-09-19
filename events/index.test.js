import handleChannelBouncer from './channelBouncer';
import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';
import { handleSource, handleHelp } from './help';
import eventHandler from './index';

jest.mock('./channelRanks');
jest.mock('./globalRanks');
jest.mock('./channelBouncer');
jest.mock('./help');

function validateCorrectHandler(expectedHandler) {
  const allHandlers = [
    channelRanksHandler,
    globalRanksHandler,
    handleChannelBouncer,
    handleSource,
    handleHelp,
  ];
  allHandlers.forEach((handler) => {
    if (expectedHandler === handler) {
      expect(handler).toBeCalled();
    } else {
      expect(handler).not.toBeCalled();
    }
  });
}

describe('eventHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('non matching type skips handlers', async () => {
    const payload = {
      event: {
        type: 'gibberish',
        text: 'channel ranks',
      },
    };
    await eventHandler(payload);
    validateCorrectHandler(null);
  });

  it('non matching app_mention skips handlers', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'gibberish',
      },
    };
    await eventHandler(payload);
    validateCorrectHandler(null);
  });

  it('processes channel ranks messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix channel ranks suffix',
      },
    };
    channelRanksHandler.mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    validateCorrectHandler(channelRanksHandler);
    expect(channelRanksHandler).toBeCalledWith(payload);
  });

  it('processes global ranks messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix global ranks suffix',
      },
    };
    globalRanksHandler.mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    validateCorrectHandler(globalRanksHandler);
    expect(globalRanksHandler).toBeCalledWith(payload);
  });

  it('processes channel bouncer messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix channel bouncer suffix',
      },
    };
    handleChannelBouncer.mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    validateCorrectHandler(handleChannelBouncer);
    expect(handleChannelBouncer).toBeCalledWith(payload);
  });

  it('processes source messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix source suffix',
      },
    };
    await eventHandler(payload);
    validateCorrectHandler(handleSource);
    expect(handleSource).toBeCalled();
  });

  it('processes help messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix help suffix',
      },
    };
    await eventHandler(payload);
    validateCorrectHandler(handleHelp);
    expect(handleHelp).toBeCalled();
  });

  it('processes member_joined_channel', async () => {
    const payload = {
      event: {
        type: 'member_joined_channel',
      },
    };
    handleChannelBouncer.mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    validateCorrectHandler(handleChannelBouncer);
    expect(handleChannelBouncer).toBeCalledWith(payload);
  });
});
