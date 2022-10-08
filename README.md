# moleculer-mixin-easy-cron

## Install

```bash
npm i github:moleculer-mixin-easy-cron@main
# or
yarn add github:moleculer-mixin-easy-cron@main
```

## Use

```javascript
// ./src/services/my-cron.service.js
const Cron = require("moleculer-mixin-easy-cron");

module.exports = {
  name: "cron-daily",
  mixins: [Cron],

  settings: {
    cron: {
      interval: '0 0 0 * * *',
    }
  },

  actions: {
    tick: (ctx) => ctx.emit('tick:day')
  }
};
```
