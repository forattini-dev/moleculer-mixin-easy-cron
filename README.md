# moleculer-easy-amqp

## Install

```bash
npm i moleculer-easy-amqp

# or

yarn add moleculer-easy-amqp
```

## Use

```javascript
// ./src/services/queues.service.js
const AmqpMixin = require("moleculer-easy-amqp");

const {
  RABBITMQ_CONNECTION_STRING,
  RABBITMQ_ASSERT_QUEUE = 'false',
  RABBITMQ_ASSERT_EXCHANGE = 'false',
} = process.env

module.exports = {
  name: "queues",
  mixins: [AmqpMixin],

  settings: {
    amqp: {
      url: RABBITMQ_CONNECTION_STRING,

      exchange: {
        assert: Boolean(RABBITMQ_ASSERT_EXCHANGE || 'false'),
        name: 'provider',
        type: 'fanout',
      },

      queues: {
        assert: Boolean(RABBITMQ_ASSERT_QUEUE || 'false'),
        prefix: 'provider.',
      }
    }
  },

  queues: {
    "resource.created": {
      async handler(channel, message) {
        console.log("application created", message.content.toString())
        channel.ack(message)
      }
    },
    
    "resource.updated": {
      async handler(channel, message) {
        console.log("application updated", message.content.toString())
        channel.ack(message)
      }
    }
  },
}
```
