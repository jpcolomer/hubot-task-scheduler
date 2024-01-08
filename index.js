// Description:
//   Hubot job scheduler
// 
// Configuration:
//   HUBOT_JOB_CHANNEL - the default room hubot logs to
//   HUBOT_JOB_DIR - Directory containing job scripts
// 
// Commands:
//   hubot run job <job name>
//   hubot schedule job <job name> "cron"
//   hubot delete scheduled job <job name>
//   hubot list scheduled jobs

var Scheduler = require('./lib/scheduler');

module.exports = function(bot){

  const scheduler = () => bot.Scheduler || Scheduler;

  const room = process.env.HUBOT_JOB_CHANNEL;

  function sendMessage(bot, message, msg, channel = room){
    bot.messageRoom(channel, msg);
    if (message && message.envelope && message.envelope.room !== room){
      message.send(msg);
    }
  }

  scheduler().initializeScheduledJobs(bot);

  bot.respond(/run job (.+)$/i, function(message){
    const ref = message.match.slice(1);
    const fn = ref[0];
    return scheduler().jobFunctions[fn](
      {
        send: function(msg, channel = room){
          sendMessage(bot, message, msg, channel);
        },
        bot
      }
    );
  });

  bot.respond(/delete scheduled job (.+)$/i, function(message){
    const ref = message.match.slice(1);
    const fn = ref[0];
    return scheduler().deleteScheduledJob(bot, fn)
      .then(function(){
        return sendMessage(bot, message, "Deleted scheduled job " + fn);
      },
        function(err){
          return sendMessage(bot, message, "Failed deletion of scheduled job " + fn);
        });
  });

  bot.respond(/schedule job (.+) [“”"'‘](.+)[“”"'’]$/i, function(message){
    const ref = message.match.slice(1);
    const fn = ref[0];
    const cronTime = ref[1];
    message.send("Scheduling Job");
    return scheduler().scheduleJob(bot, fn, cronTime)
      .then(function(){
        return scheduler().registerJob(fn, cronTime,
          {
            send: function(msg, channel = room){
              sendMessage(bot, message, msg, channel);
            },
            bot
          }
        );
      })
      .then(function(){
        return sendMessage(bot, message, `Scheduled ${fn} '${cronTime}'`);
      });
  });

  bot.respond(/list scheduled jobs/i, function(message){
    const brainScheduledJobs = bot.brain.get(scheduler().JOBS);
    const list = Object.keys(brainScheduledJobs || {}).reduce(function(o, d){
      o += '[' + d + ']: ' + brainScheduledJobs[d][1] + '\n';
      return o;
    }, '');
    sendMessage(bot, message, list.length && list || 'No scheduled jobs');
  });
};
