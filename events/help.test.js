import SlackClient from '../libs/slack';
import { handleSource, handleHelp, handleVersion } from './help';

jest.mock('../libs/slack');

describe('help', () => {
  describe('handleSource', () => {
    it('outputs repository', async () => {
      const payload = {
        event: {
          channel: 'testChannel',
        },
      };
      await handleSource(payload);
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        channel: 'testChannel',
        text: 'Source: https://github.com/adamldoyle/analytics-slack-bot',
      });
    });
  });

  describe('handleHelp', () => {
    it('outputs help', async () => {
      const payload = {
        event: {
          channel: 'testChannel',
        },
      };
      await handleHelp(payload);
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        channel: 'testChannel',
        text:
          'Available commands: "channel bouncer", "channel ranks", "global ranks", "help", "source", "version"',
      });
    });
  });

  describe('handleVersion', () => {
    it('outputs version', async () => {
      const payload = {
        event: {
          channel: 'testChannel',
        },
      };
      await handleVersion(payload);
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        channel: 'testChannel',
        text: expect.stringMatching(/Current version: [0-9]+\.[0-9]+\.[0-9]+/),
      });
    });
  });
});
