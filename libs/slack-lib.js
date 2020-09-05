import { WebClient } from '@slack/web-api';
const token = process.env.SLACK_TOKEN;
export default new WebClient(token);
