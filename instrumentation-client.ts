import { initBotId } from 'botid/client/core';

initBotId({
  protect: [
    {
      path: '/api/submit',
      method: 'POST'
    }
  ]
});
