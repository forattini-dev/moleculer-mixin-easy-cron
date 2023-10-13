const Amqp = require("amqplib")
const { Errors } = require("moleculer")
const { forIn, isFunction, isObject, merge } = require("lodash")

const {
  RABBITMQ_PREFETCH = '3',
  RABBITMQ_CONNECTION_STRING,
  RABBITMQ_ASSERT_QUEUE = 'false',
  RABBITMQ_ASSERT_EXCHANGE = 'false',
} = process.env

module.exports = {
  settings: {
    amqp: {
      url: RABBITMQ_CONNECTION_STRING,

      channels: {
        prefetch: parseInt(RABBITMQ_PREFETCH),
        consume: {
          noAck: false,
        }
      },

      exchange: {
        name: null,
        assert: new Boolean(RABBITMQ_ASSERT_EXCHANGE),
        type: 'direct',
        config: {}
      },

      queues: {
        prefix: '',
        assert: new Boolean(RABBITMQ_ASSERT_QUEUE),
        config: {
          durable: true
        },
      },

      messages: {
        persistent: false,
      },
    },
  },

  created() {
    this.$queues = {};
    this.$channels = {};
    this.$channel = null;
    this.$connection = null;
  },

  async started() {
    const {
      url,
      queues: queuesConfig,
      channels: channelsConfig,
    } = this.settings.amqp;

    if (!url) throw new Errors.ServiceSchemaError("Missing [url] options.");

    try {
      this.$connection = await Amqp.connect(url);
      this.$channel = await this.$connection.createChannel();

      if (this.schema.queues) {
        forIn(this.schema.queues, async (funOrObj, name) => {
          const fullname = queuesConfig.prefix + name

          const fn = isFunction(funOrObj)
            ? funOrObj
            : funOrObj.handler;

          const channel = await this.createChannelForQueue(
            fullname,
            merge(queuesConfig, isObject(funOrObj) ? funOrObj : {})
          );

          this.$channels[fullname] = channel;

          if ([false, 'false'].includes(funOrObj.active)) return
           
          channel.consume(fullname, fn.bind(this, channel), channelsConfig.consume);
        })
      }
    } catch (err) {
      this.logger.error(err);
      throw new Errors.MoleculerError("Unable to connect to AMQP.");
    }
  },

  async stopped() {
    try {
      await this.$connection.disconnect();
    } catch (e) {
      this.logger.warn("Unable to stop database connection gracefully.", e);
    }
  },

  actions: {

    sendMessage: {
      params: {
        queue: "string|optional",
        body: ["object", "string"],
        routingKey: "string|optional",
      },

      async handler(ctx) {
        return this.sendMessage(ctx.params);
      },
    },

  },

  methods: {

    async createChannelForQueue(name, { routingKey, config = {} }) {
      const {
        queues: queuesConfig,
        channels: channelsConfig,
        exchange: exchangeConfig,
      } = this.settings.amqp;

      if (!this.$queues[name]) {
        try {
          const channel = await this.$connection.createChannel();

          channel.on("close", () => { delete this.$queues[name] });
          channel.on("error", (err) => { this.logger.error(err) });

          if ([true, 'true'].includes(exchangeConfig.assert)) {
            this.logger.warn(`asserting exchange: ${exchangeConfig.name}`)

            await channel.assertExchange(
              exchangeConfig.name,
              exchangeConfig.type,
              exchangeConfig.config,
            )
          }

          if ([true, 'true'].includes(queuesConfig.assert)) {
            this.logger.warn(`asserting queue: ${name}`)

            await channel.assertQueue(name, merge(queuesConfig.settings, config))
            if (exchangeConfig.name) await channel.bindQueue(name, exchangeConfig.name, routingKey || name)
          }

          channel.prefetch(channelsConfig.prefetch)
          this.$queues[name] = channel
        } catch (err) {
          this.logger.error(err);
          throw new Errors.MoleculerError("Unable to start queue")
        }
      }

      return this.$queues[name]
    },

    async sendMessage({ body, queue, routingKey }) {
      const {
        queues, 
        exchange, 
        messages: messagesConfig, 
      } = this.settings.amqp;
      
      let queueName = queues.prefix + queue
      let content = isObject(body) ? JSON.stringify(body) : body
      content = Buffer.from(content)

      return !exchange.name
        ? this.$channel.sendToQueue(queueName, content, messagesConfig)
        : !routingKey
          ? this.$channel.publish(exchange.name, queueName, content, messagesConfig)
          : this.$channel.publish(
            exchange.name,
            routingKey || queueName,
            content,
            messagesConfig
          )
    },
  },
};
