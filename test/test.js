var request = require('request'),
  assert = require('assert'),
  app = require('../server'),
  base_url = 'http://localhost:8080/',
  nock = require('nock');

describe('GCI Invite', function() {
  describe('Main page', function () {
    it('returns 200 HTTP code', function (done) {
      request(base_url, function(err, response) {
        assert.equal(200, response.statusCode);
        done();
      });
    });
    it('should have form in HTML', function (done) {
      request(base_url, function(err, response, body) {
        assert.notEqual(-1, body.search('form'));
        done();
      });
    });
  });
  describe('Login page', function () {
    it('should be redirected to github login page', function (done) {
      request.post({url: base_url + 'login', form: {student: 'sevazhidkov'}},
        function(err, response) {
          assert.equal(302, response.statusCode);
          assert.notEqual(-1, response.headers.location.search('github.com'));
          done();
        }
      );
    });
  });
  describe('Callback page', function () {
    it("shouldn't have errors", function (done) {
      // newbie - example new student nickname
      // sevazhidkov - example mentor nickname

      // Nock for getting access token
      nock('https://github.com/')
        .post('/login/oauth/access_token')
        .reply(200, {access_token: "e72e16c7e42f292c6912e7710c838347ae178b4a"});

      // Nock for getting user's information
      nock('https://api.github.com')
        .get('/user')
        .reply(200, {login: 'sevazhidkov'});

      // Nock for getting user's rights in organization
      nock('https://api.github.com')
        .get('/teams/'+app.config.mentorGroupId+'/memberships/sevazhidkov')
        .reply(200, {name: 'sevazhidkov', state: 'active'});

      // Nock for adding student to organization
      nock('https://api.github.com')
        .put('/teams/'+app.config.studentGroupId+'/memberships/newbie')
        .reply(200, {name: 'sevazhidkov', state: 'pending'});

      request(base_url + 'callback?student=newbie&code=12345&state=' + app.state,
        function(err, response, body) {
          assert.equal(200, response.statusCode);
          assert.notEqual(-1, body.search('Student newbie is invited. Thanks sevazhidkov'));
          done();
        }
      );
    });
  });
});
