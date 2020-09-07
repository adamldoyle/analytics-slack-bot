import channelRanksHandler from './channelRanks';
import eventHandler from './index';

jest.mock('./channelRanks');

describe('eventHandler', () => {
  it('non matching app_mention skips handlers', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'gibberish',
      },
    };
    await eventHandler(payload);
    expect(channelRanksHandler).not.toBeCalled();
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
    expect(channelRanksHandler).toBeCalledWith(payload);
  });
});
