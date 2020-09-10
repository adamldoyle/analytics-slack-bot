import channelRanksHandler from './channelRanks';
import globalRanksHandler from './globalRanks';
import { handleSource, handleHelp } from './help';
import eventHandler from './index';

jest.mock('./channelRanks');
jest.mock('./globalRanks');
jest.mock('./help');

describe('eventHandler', () => {
  it('non matching type skips handlers', async () => {
    const payload = {
      event: {
        type: 'gibberish',
        text: 'channel ranks',
      },
    };
    await eventHandler(payload);
    expect(channelRanksHandler).not.toBeCalled();
    expect(globalRanksHandler).not.toBeCalled();
    expect(handleSource).not.toBeCalled();
    expect(handleHelp).not.toBeCalled();
  });

  it('non matching app_mention skips handlers', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'gibberish',
      },
    };
    await eventHandler(payload);
    expect(channelRanksHandler).not.toBeCalled();
    expect(globalRanksHandler).not.toBeCalled();
    expect(handleSource).not.toBeCalled();
    expect(handleHelp).not.toBeCalled();
  });

  it('processes channel ranks messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix channel ranks suffix',
      },
    };
    (channelRanksHandler as jest.Mock).mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    expect(channelRanksHandler).toBeCalledWith(payload);
  });

  it('processes global ranks messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix global ranks suffix',
      },
    };
    (globalRanksHandler as jest.Mock).mockResolvedValue(true);
    const response = await eventHandler(payload);
    expect(response).toBeTruthy();
    expect(globalRanksHandler).toBeCalledWith(payload);
  });

  it('processes source messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix source suffix',
      },
    };
    await eventHandler(payload);
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
    expect(handleHelp).toBeCalled();
  });
});
