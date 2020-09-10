import { format } from 'util';
import { config } from 'aws-sdk';

let logs;

export default function debug(...args: any[]) {
  logs.push({
    date: new Date(),
    // eslint-disable-next-line prefer-spread
    string: format.apply(null, args),
  });
}

config.logger = { log: debug };

export function init(event, context) {
  logs = [];

  debug('API event', {
    body: event.body,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
  });
}

export function flush(e) {
  // eslint-disable-next-line no-console
  logs.forEach(({ date, string }) => console.debug(date, string));
  // eslint-disable-next-line no-console
  console.error(e);
}
