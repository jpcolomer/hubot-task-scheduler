let expect = require('chai').expect;

let Scheduler = require('../lib/scheduler');

describe('Scheduler', () => {
  let mem = {};
  let hubotMock = {brain: {set: (k,v) => mem[k]=v, get: (k) => mem[k], save: () => true }};

  describe(".scheduleJob", () => {
    beforeEach(() => {
      Scheduler.scheduleJob(hubotMock, "fakeFn", "* * * * *");
    });
    afterEach(() => {
      mem = {};
    });
    it("should save it in memory", () => {
      expect(hubotMock.brain.get(Scheduler.JOBS)).to.eql({"fakeFn": ["fakeFn", "* * * * *"]})
    });
  });

  describe(".deleteScheduledJob", () => {
    beforeEach(() => {
      mem = {};
      Scheduler.scheduleJob(hubotMock, "fakeFn", "* * * * *")
        .then( () => Scheduler.registerJob("fakeFn", "* * * * *", {send: (msg) => console.log(msg)}));
    });

    it("should delete it from memory", () => {
      return Scheduler.deleteScheduledJob(hubotMock,"fakeFn")
        .then(() => expect(hubotMock.brain.get(Scheduler.JOBS)).to.eql({}));
    });
  });
});
