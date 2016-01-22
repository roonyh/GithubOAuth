var http = require('http');
var dispatcher = require('httpdispatcher');
var request = require('request');
var url = require('url');
var uuid = require('node-uuid');
var qs = require('querystring');
var config = require('./config.js');

var host = config.host;
var options = { //for github api
  clientID: config.client_id,
  secret: config.secret,
  scope: '',
  redirectURI: 'http://localhost:8080/callback', //make sure this is the same as the callback URI in github
};

var state = uuid.v4(); //Random string

//main page
dispatcher.onGet("/", function(req, res) {
  var data = "<!DOCTYPE html><html><body><form action=\"/login\" method=\"post\">GH username of the student:<br><input type=\"text\" name=\"student\"><br><input type=\"submit\" value=\"Submit\"></form></body></html>";
  res.write(data);
  res.end();
});

//login page
dispatcher.onPost("/login", function(req, res) {
   var query = qs.parse(req.body);
   var _url = 'https://github.com/login/oauth/authorize'
   + '?client_id=' + options.clientID
   + (options.scope ? '&scope=' + options.scope : '')
   + '&redirect_uri=' + options.redirectURI + encodeURIComponent("?student="+query.student)
   + '&state=' + state
   ;
   res.statusCode = 302;
   res.setHeader('location', _url);
   res.end();
});

dispatcher.onGet("/callback", function(req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  //returns something like { code: '6cd032d64f7b45f0d339', state: '10' }
  if(query.state == state) { //supposed to be if states match

    var arguments = {
      code: query.code,
      client_id: options.clientID,
      client_secret: options.secret
    };
    request.post({url: 'https://github.com/login/oauth/access_token', formData: arguments, headers: {'Accept': 'application/json'}}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var token = JSON.parse(body).access_token;
        welcome(res, token, query.student);
      } else {
        res.end("Error while getting access token");
      }
    });

  }
  else {
    res.end("Error");
  }
});

//print welcome statement
function welcome(res, token, student) {

  var userRequestOptions = {
    url: "https://api.github.com/user",
    headers: {
      'Authorization': 'token '+token,
      'User-Agent': 'Mozilla/5.0'
    }
  }

  request.get(userRequestOptions, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var user = JSON.parse(body).login;
      checkMembership(user, student, res);
    } else {
      res.end("Error in authorization")
    }
  });
}

function checkMembership(user, student, res) {
  var checking = {
    teamID: config.mentorGroupId, //FOSSASIA-GCI
    user: user
  };

  var checkMembershipOptions = {
    url: 'https://api.github.com/teams/'+checking.teamID+'/memberships/'+checking.user,
    headers: {
      'Authorization': 'token ' + config.ownerPersonalAccessToken,
      'User-Agent': 'Mozilla/5.0'
    }
  };

  request.get(checkMembershipOptions, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body);
      if(body.state == "active") {
        addStudent(student, user, res);
      } else {
        res.end("You don't have permission to add students.");
      }
    } else {
      res.end("You don't have permission to add students.");
    }
  });

}

function addStudent(student, user, res) {
  console.log(user + ' adding ' + student);
  var adding = {
    teamID: config.studentGroupId, //FOSSASIA-GCI-Students
    user: student
  };

  var options = {
    url: 'https://api.github.com/teams/'+adding.teamID+'/memberships/'+adding.user,
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
      } else if(body.state == "active") {
        res.end("Student " + student + " is already a member. Thanks " + user + " :)");
      } else {
        res.end("Something went wrong :( Please post in slack group instead. Thanks " + user + " :)");
      }
    } else {
      res.end("Something went wrong :( Please post in slack group instead. Thanks " + user + " :)");
    }
  });
}


//define port for listening for web server
var PORT = 8080;

//handle requests function
function handleRequest (request, response) {
  try {
    //Disptach
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.log(err);
  }
}


//create a server
var server = http.createServer(handleRequest);

//start the server on the port
server.listen(PORT, function () {
  console.log("Server listening on: http://"+host+":%s", PORT);
});

exports.server = server;
