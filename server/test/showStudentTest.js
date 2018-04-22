require('../models/Student');
require('dotenv').config({ path: 'variables.env' });
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const request = require('supertest');
const scraper = require('../helpers/scraper');
const app = require('../app');

chai.use(require('sinon-chai'));
const sandbox = sinon.sandbox.create();

afterEach(function() {
  sandbox.restore();
});

describe('GET /students', () => {

  before(function (done) {
    // Connect to the Database
    mongoose.connect(process.env.DATABASE, {
      useMongoClient: true
    });

    mongoose.Promise = global.Promise;
    mongoose.connection.on('error', (err) => {
      console.error(`🙅 🚫 → ${err.message}`);
    });

    mongoose.connection.once('open', function() {
      console.log('We are connected to test database!');
      done();
    });
  });

  const dummyStudentResults  = [
    {
      _id: '5a28cd1b1805592081cd31ea',
      name: 'studentName',
      username: 'studentUserName',
      email: 'studentEmail',
      notes: 'studentNote',
      __v: 0
    }
  ];

  function stubDB(dummyStudentResults) {
    sandbox.stub(db, 'collection').returns({
      find: function() {
        return {
          toArray: function(cb) {
            cb(null, dummyStudentResults);
          }
        };
      }
    });
  }

  function stubScraper(error, scraperResponse) {
    sandbox
      .stub(scraper, 'fetchUserInfoFromFCC')
      .yieldsAsync(error, scraperResponse);
  }

  xit('should return 200', done => {
    stubDB(dummyStudentResults);
    stubScraper(false, { daysInactive: 1 });
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

  xit('should fetch data from mongo DB', done => {
    stubDB(dummyStudentResults);
    stubScraper(false, { daysInactive: 1 });
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(JSON.parse(res.text)[0].name).to.equal(
          dummyStudentResults[0].name
        );
        expect(JSON.parse(res.text)[0].username).to.equal(
          dummyStudentResults[0].username
        );
        expect(JSON.parse(res.text)[0].email).to.equal(
          dummyStudentResults[0].email
        );
        expect(JSON.parse(res.text)[0].notes).to.equal(
          dummyStudentResults[0].notes
        );
        done();
      });
  });

  xit('should return a 200 and an empty array if the database is empty', done => {
    let noResults = [];
    stubDB(noResults);
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text)).to.be.an('array').that.is.empty;
        done();
      });
  });

  xit('should look up student github username', done => {
    stubScraper(false, { daysInactive: 1 });
    stubDB(dummyStudentResults);
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(JSON.parse(res.text)[0].daysInactive).to.equal(1);
        done();
      });
  });

  xit('should returns new submissions count and titles', done => {
    stubScraper(false, {
      completedChallenges: [
        { title: 'Reverse a String' },
        { title: 'Say Hello to HTML Elements' }
      ]
    });
    stubDB(dummyStudentResults);
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(JSON.parse(res.text)[0].newSubmissionsCount).to.equal(1);
        done();
      });
  });

  xit('should returns new submissions count and titles when student completedChallengesCount is undefined', done => {
    stubScraper(false, {
      completedChallenges: [
        { title: 'Reverse a String' },
        { title: 'Say Hello to HTML Elements' }
      ]
    });
    stubDB(dummyStudentResults);
    request(app)
      .get('/students')
      .end(function(_err, res) {
        expect(JSON.parse(res.text)[0].newSubmissionsCount).to.equal(2);
        done();
      });
  });
});
