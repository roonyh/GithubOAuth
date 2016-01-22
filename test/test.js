var request = require('request'),
  assert = require('assert'),
  app = require('../server'),
  base_url = 'http://localhost:8080/';

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
});
