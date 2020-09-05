import handler from './libs/handler-lib';

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);

  return data;
});
