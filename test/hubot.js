let expect = require('chai').expect;
const sinon = require('sinon');
const co = require('co');

let Helper = require('hubot-test-helper');
let helper = new Helper('../index.js');

let SchedulerMock = {
  scheduleJob: () => Promise.resolve(),
  registerJob: () => Promise.resolve(),
  deleteScheduledJob: () => Promise.resolve(),
  jobFunctions: {
    fakeFn: () => Promise.resolve()
  }
};

describe("messages", () => {
  let room;
  beforeEach(() => {
    room = helper.createRoom();
    room.robot.Scheduler = SchedulerMock;
  });
  afterEach(() => {
    room.destroy();
  });

  context("runs job", () => {
    let spy;

    beforeEach(() => {
      return co(function*() {
        spy = sinon.spy(SchedulerMock.jobFunctions,"fakeFn");
        yield room.user.say("john", "@hubot run job fakeFn");
      }.bind(this));
    });

    afterEach(() => {
      SchedulerMock.jobFunctions.fakeFn.restore();
    });

    it("calls Scheduler.deleteScheduleJob", ()=>{
      expect(spy.calledOnce).to.true;
    });

  });

  context("deletes scheduled job", () => {
    let deleteScheduleJobSpy;

    beforeEach(() => {
      return co(function*() {
        deleteScheduleJobSpy = sinon.spy(SchedulerMock,"deleteScheduledJob");
        yield room.user.say("john", "@hubot delete scheduled job fakeJob");
      }.bind(this));
    });

    afterEach(() => {
      SchedulerMock.deleteScheduledJob.restore();
    });

    it("should respond back", () =>{
      expect(room.messages).to.eql([
        [ 'john', '@hubot delete scheduled job fakeJob' ],
        [ 'hubot', 'Deleted scheduled job fakeJob' ]
      ]);
    });

    it("calls Scheduler.deleteScheduleJob", ()=>{
      expect(deleteScheduleJobSpy.calledOnce).to.true;
    });

  });

  context("schedules job", () => {
    let scheduleJobSpy,registerJobSpy;

    beforeEach(() => {
      return co(function*() {
        scheduleJobSpy = sinon.spy(SchedulerMock,"scheduleJob");
        registerJobSpy = sinon.spy(SchedulerMock,"registerJob");
        yield room.user.say("john", "@hubot schedule job fakeJob '* * * * *'");
      }.bind(this));
    });

    afterEach(() => {
      SchedulerMock.scheduleJob.restore();
      SchedulerMock.registerJob.restore();
    });

    it("should respond back", ()=>{
      expect(room.messages).to.eql([
        ['john',"@hubot schedule job fakeJob '* * * * *'"],
        ["hubot", "Scheduling Job"],
        ["hubot", "Scheduled fakeJob '* * * * *'"],
      ]);
    });

    it("should call Scheduler.scheduleJob", ()=>{
      expect(scheduleJobSpy.calledOnce).to.true;
    });

    it("should call Scheduler.registerJob", ()=>{
      expect(registerJobSpy.calledOnce).to.true;
    });

  });

  context("lists schedules jobs", () => {
    it("responds No scheduled jobs", () =>{
      // This test should be changed
      return Promise.resolve(room.user.say("john", "@hubot list scheduled jobs"))
        .then( () => expect(room.messages.slice(0,2)).to.eql([
          ["john", "@hubot list scheduled jobs"],
          ["hubot", 'No scheduled jobs']
        ]));
    });
  });
});
