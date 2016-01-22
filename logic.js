var request = require('request');
var url = require('url');
var uuid = require('node-uuid');

var config = require('./config.js');

var state = uuid.v4(); //Random string

//return the state (random string)
var getState = function() {
  return state;
};

//retrieve auth token
var getToken = function(req, callback) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  //returns something like { code: '6cd032d64f7b45f0d339', state: '10' }
  if(query.state == state) { //supposed to be if states match

    var args = {
      code: query.code,
      client_id: config.client_id,
      client_secret: config.secret
    };
    request.post({url: 'https://github.com/login/oauth/access_token', formData: args, headers: {'Accept': 'application/json'}}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var token = JSON.parse(body).access_token;
        callback(null, token, query.student);
      } else {
        callback(new Error("Error while getting access token"));
      }
    });

  }
  else {
    callback(new Error("Error while getting access token"));
  }
};

//print welcome statement
var welcome = function(token, callback) {

  var userRequestOptions = {
    url: "https://api.github.com/user",
    headers: {
      'Authorization': 'token ' + token,
      'User-Agent': 'Mozilla/5.0'
    }
  };

  request.get(userRequestOptions, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var user = JSON.parse(body).login;
      callback(null, user); // Everything went OK
    } else {
      callback(new Error('Auth error')); // Auth error
    }
  });
};

var checkMembership = function(user, callback) {
  var checking = {
    teamID: config.mentorGroupId, //FOSSASIA-GCI
    user: user
  };

  var checkMembershipOptions = {
    url: 'https://api.github.com/teams/' + checking.teamID + '/memberships/' + checking.user,
    headers: {
      'Authorization': 'token ' + config.ownerPersonalAccessToken,
      'User-Agent': 'Mozilla/5.0'
    }
  };

  request.get(checkMembershipOptions, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body);
      if(body.state == "active") {
        callback(null, body); // Everything went OK
      } else {
        callback(new Error('Permissions error: You don\'t have permission to add students')); // Permissions error
      }
    } else {
      callback(new Error('Couldn\'t check membership')); // API error
    }
  });
};

var addStudent = function(user, student, res, callback) {
  console.log(user + ' adding ' + student);
  var adding = {
    teamID: config.studentGroupId, //FOSSASIA-GCI-Students
    user: student
  };

  var options = {
    url: 'https://api.github.com/teams/' + adding.teamID + '/memberships/' + adding.user,
    headers: {
      'Authorization': 'token ' + config.ownerPersonalAccessToken,
      'User-Agent': 'Mozilla/5.0'
    }
  };

  request.put(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body);
      var state = "";
      if(body.state == "pending"){
        res.end("Student " + student + " is invited. Thanks " + user + " :)");
        callback(null, body); // Everything went OK
      } else if(body.state == "active") {
        res.end("Student " + student + " is already a member. Thanks " + user + " :)");
        callback(null, body); // Everything went OK
      } else {
        callback(new Error('Something went wrong! Please post in slack group instead.')); // Error
      }
    } else {
      callback(new Error('Something went wrong! Please post in slack group instead.')); // Error
    }
  });
};

module.exports = {
  getState: getState,
  getToken: getToken,
  welcome: welcome,
  checkMembership: checkMembership,
  addStudent: addStudent
};
