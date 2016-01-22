var http = require('http');
var dispatcher = require('httpdispatcher');
var qs = require('querystring');

var config = require('./config.js');
var logic = require('./logic.js');

var host = config.host;

//define port for listening for web server
var PORT = config.port;

//main page
dispatcher.onGet("/", function(req, res) {
  var data = "<!DOCTYPE html><html><body><form action=\"/login\" method=\"post\">GH username of the student:<br><input type=\"text\" name=\"student\"><br><input type=\"submit\" value=\"Submit\"></form></body></html>";
  res.write(data);
  res.end();
});

//login page
dispatcher.onPost("/login", function(req, res) {
   var query = qs.parse(req.body);
   var _url = 'https://github.com/login/oauth/authorize' +
   '?client_id=' + config.client_id +
   (config.scope ? '&scope=' + config.scope : '') +
   '&redirect_uri=' + config.redirectURI + encodeURIComponent("?student=" + query.student) +
   '&state=' + logic.getState();

   res.statusCode = 302;
   res.setHeader('location', _url);
   res.end();
});

dispatcher.onGet("/callback", function(req, res) {
  logic.getToken(req, function(err, token, student) {
    if(err) { res.end(err); return; }

    logic.welcome(token, function(err, user) {
      if(err) { res.end(err); return; }

      logic.checkMembership(user, function(err, body) {
        if(err) { res.end(err); return; }

        logic.addStudent(user, student, res, function(err) {
          if(err) { res.end(err); return; }
        });
      });
    });
  });
});

//create a server
var server = http.createServer(function(req, res) {
  /*try {*/
    //Dispatch
    dispatcher.dispatch(req, res);
  /*} catch(err) {
    throw err;
  }*/
});

//start the server on the port
server.listen(PORT, function () {
  console.log("Server listening on: http://" + host + ":%s", PORT);
});
