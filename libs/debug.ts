import { format } from 'util';
import { config } from 'aws-sdk';

let logs;

config.logger = { log: debug };

export default function debug(...args: any[]) {
  logs.push({
    date: new Date(),
    string: format.apply(null, args),
  });
}

export function init(event, context) {
  logs = [];

  debug('API event', {
    body: event.body,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
  });
}

export function flush(e) {
  logs.forEach(({ date, string }) => console.debug(date, string));
  console.error(e);
}
