# moleculer-mixin-easy-cron

## Install

```bash
npm i moleculer-mixin-easy-cron

# or

yarn add moleculer-mixin-easy-cron
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
