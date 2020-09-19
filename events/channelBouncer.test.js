import wordsToNumbers from 'words-to-numbers';

describe('channelBouncerHandler', () => {
  it('', () => {
    const channel = 'top_abc';
    const re = /^(?<positions>top|bottom)_(?<rankAllowed>[a-z_]+)$/;
    const match = channel.match(re);
    if (!match) {
      return;
    }
    const { positions, count } = match.groups;
    console.log(positions);
    console.log(count);
    console.log(count.replace(/_/g, ' '));
    console.log(wordsToNumbers(count.replace(/_/g, ' ')));
  });
});
