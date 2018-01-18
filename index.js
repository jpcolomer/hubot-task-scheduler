var Scheduler = require('./lib/scheduler');

module.exports = function(bot){
  /*
  Description:
    Hubot job scheduler

  Configuration:
    HUBOT_JOB_CHANNEL - the default room hubot logs to
    HUBOT_JOB_DIR - Directory containing job scripts

  Commands:
    hubot run job <job name>
    hubot schedule job <job name> "cron"
    hubot delete scheduled job <job name>
    hubot list scheduled jobs
    */

  let scheduler = () => bot.Scheduler || Scheduler;

  var room = process.env.HUBOT_JOB_CHANNEL;

  function sendMessage(bot, message, msg) {
    bot.messageRoom(room, msg);
    if (message && message.envelope && message.envelope.room !== room){
      message.send(msg);
    }
  }

  scheduler().initializeScheduledJobs(bot);

  bot.respond(/run job (.+)$/i, function(message){
    var ref = message.match.slice(1);
    var fn = ref[0];
    return scheduler().jobFunctions[fn](
      {
        send: function(msg){
          sendMessage(bot,message,msg);
        }
      }
    );
  });

  bot.respond(/delete scheduled job (.+)$/i, function(message){
    var ref = message.match.slice(1);
    var fn = ref[0];
    return scheduler().deleteScheduledJob(bot,fn)
      .then(function(){
        return sendMessage(bot, message, "Deleted scheduled job " + fn);
      },
        function(err){
          return sendMessage(bot, message, "Failed deletion of scheduled job " + fn);
        });
  });

  bot.respond(/schedule job (.+) [“”"'‘](.+)[“”"'’]$/i, function(message){
    var ref = message.match.slice(1);
    var fn = ref[0];
    var cronTime = ref[1];
    message.send("Scheduling Job");
    return scheduler().scheduleJob(bot,fn,cronTime)
      .then(function(){
        return scheduler().registerJob(fn,cronTime,
          {
            send: function(msg){
              sendMessage(bot,message,msg);
            }
          }
        );
      })
      .then(function(){
        return sendMessage(bot,message,`Scheduled ${fn} '${cronTime}'`);
      });
  });

  bot.respond(/list scheduled jobs/i, function(message) {
    var brainScheduledJobs = bot.brain.get(scheduler().JOBS);
    var list = Object.keys(brainScheduledJobs||{}).reduce(function(o,d) {
      o += '['+d+']: '+brainScheduledJobs[d][1]+'\n';
      return o;
    }, '');
    sendMessage(bot,message, list.length && list || 'No scheduled jobs');
  });
}
