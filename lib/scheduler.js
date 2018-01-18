var scheduledJobs = {};
var Promise = require('bluebird'),
  CronJob = require('cron').CronJob;

var jobFunctions = require(process.env.HUBOT_JOB_DIR || "../jobs");

var JOBS = "scheduledJobs";
var room = process.env.HUBOT_JOB_CHANNEL;

let Scheduler = {
  JOBS: JOBS,
  jobFunctions: jobFunctions,
  scheduledJobs: scheduledJobs,
  scheduleJob: function(bot,fn,cronTime){
    var jobs = bot.brain.get(JOBS) || {};
    jobs[fn] = [fn, cronTime];
    bot.brain.set(JOBS, jobs);
    return Promise.resolve(bot.brain.save());
  },

  registerJob: function(fn,cronTime,res){
    if(scheduledJobs[fn])
      scheduledJobs[fn].stop();
    var job = new CronJob({
      cronTime: cronTime,
      onTick: function(){
        return jobFunctions[fn](res);
      },
      start: true,
      timeZone: 'America/New_York'
    });
    scheduledJobs[fn] = job;
  },

  initializeScheduledJobs: function(bot){
    bot.brain.on("loaded", () =>
     Promise.resolve(bot.brain.get('scheduledJobs') || {})
      .then(brainScheduledJobs => {
        for (k in brainScheduledJobs){
          var job = brainScheduledJobs[k];
          Scheduler.registerJob(
            job[0],
            job[1],
            {
              send:function(msg) {
                bot.messageRoom(room, msg);
              }
            }
          );
        }
      })
    );
  },

  deleteScheduledJob: function(bot,fn){
    var jobs = bot.brain.get(JOBS) || {};
    delete jobs[fn];
    bot.brain.set(JOBS, jobs);
    return Promise.resolve(bot.brain.save())
      .then(function(){
        scheduledJobs[fn].stop();
        delete scheduledJobs[fn];
      });
  },
}

module.exports = Scheduler;
