const { CronJob } = require('cron')

const {
  TZ,
} = process.env

module.exports = {
  name: "cron",

  settings: {
    cron: {
      interval: '* * * * * *',
      timezone: TZ,
    }
  },

  created () {
    this.job = this.createJob()
    this.logger.info('cronjob created')
  },

  async started () {
    this.job.start()
    this.logger.info('cronjob started')
  },

  actions: {

    tick (ctx) {
      this.logger.info('overwrite me!')
    },

  },

  methods: {
    
    createJob () {
      const { interval, timezone } = this.settings.cron
      
      return new CronJob(interval,
        function () { this.actions.tick() }.bind(this),
        null,
        false,
        timezone
      )
    },

  },
};
