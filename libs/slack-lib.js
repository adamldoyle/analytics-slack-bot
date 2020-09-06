import { WebClient } from '@slack/web-api';
import { verifyRequestSignature } from '@slack/events-api';

const token = process.env.SLACK_TOKEN;
export default new WebClient(token);

export function verifyRequest(event) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const requestTimestamp = event.headers['X-Slack-Request-Timestamp'];
  const requestSignature = event.headers['X-Slack-Signature'];
  const body = event.body;
  return verifyRequestSignature({
    signingSecret,
    requestSignature,
    requestTimestamp,
    body,
  });
}
