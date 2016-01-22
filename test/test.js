var nock   = require('nock');
var assert = require('assert');

var logic = require('../logic.js');

function responseLog(response) {
  console.log('   RESPONSE SENT: ' +  response);
}

var ghUser = nock('https://api.github.com')
              .get('/user')
              .reply(200, {
                login: 'testuser',
                id: 1234567,
                avatar_url: '',
                gravatar_id: '',
                html_url: 'https://github.com/testuser',
                type: 'User',
                name: 'Test User'
              });

describe('welcome()', function() {
  var user;
  it('Should be able to authenticate with GitHub', function(done) {
    logic.welcome('token', function(err, usr) {
      user = usr;
      done(err);
    });
  });
  it('Should gather the user\'s login properly', function() {
    assert(user === 'testuser', 'The returned user doesn\'t match');
  });
});

var ghMember = nock('https://api.github.com')
                .filteringPath(/\/teams\/(.*)/, '/teams/1234567/memberships/testuser/')
                .get('/teams/1234567/memberships/testuser/')
                .reply(200, {
                  state: 'active',
                  role: 'maintainer',
                  url: 'https://api.github.com/teams/1234567/memberships/testuser'
                });

describe('checkMembership()', function() {
  var body;
  it('Should check if a user belongs to the org', function(done) {
    logic.checkMembership('testuser', function(err, bdy) {
      body = bdy;
      done(err);
    });
  });
  it('Should get the correct user\'s state', function() {
    assert(body.state === 'active');
  });
});

var ghAdd = nock('https://api.github.com')
                .filteringPath(/\/teams\/(.*)/, '/teams/1234567/memberships/teststudent/')
                .put('/teams/1234567/memberships/teststudent/')
                .reply(200, {
                  url: "https://api.github.com/teams/1234567/memberships/teststudent",
                  role: "member",
                  state: "pending"
                });

describe('addStudent()', function() {
  var body;
  it('Should be capable to add a student to the org', function(done) {
    logic.addStudent('testuser', 'teststudent', { end: responseLog }, function(err, bdy) {
      body = bdy;
      done(err);
    });
  });
  it('Should send the invitation to the correct user', function() {
    assert(body.url.split('/').pop() === 'teststudent');
  });
  it('Should receive invitation\'s state properly', function() {
    assert(body.state === 'pending', 'The invitation\'s states don\'t match');
  });
});
