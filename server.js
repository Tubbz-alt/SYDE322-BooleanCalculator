const simplify = require('./simplify.js');
const dbManager = require("./dbManager.js");

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var app = express();

const passport = require('passport');  
const strategy = require('passport-local');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');  
const cryptoJs = require('crypto-js');
const crypto = require('crypto');

const serverSecret = crypto.createDiffieHellman(60).generateKeys('base64');
const authenticate = expressJwt({secret: serverSecret});

// Refactor method - Replace magic numbers with Symbolic Constants 
const EXPIRY_TIME = 5*60; // 5 Minutes 
const SUCCESS = 200; 
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

//access control for port for frontend
app.use(bodyParser.json(), function(req, res, next) {
	//allow multiple origins
	var allowedOrigins = ['http://localhost:8080', 'http://localhost:3000'];
	var origin = req.headers.origin;
  	if(allowedOrigins.indexOf(origin) > -1){
       res.header('Access-Control-Allow-Origin', origin);
  	}
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header(	
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
 });

//Set up a server listener on port 8080
var server = app.listen(8080, function () {
  var port = server.address().port
  console.log("Node.js server running at localhost:%s", port)
})


//====================================================//
//					Authentication					  //
//====================================================//

// purpose: uses passport-local strategy to handle username/password authentication
passport.use(new strategy( 
  function(username, password, done) {

    var encryptedPassword = cryptoJs.SHA256(password).toString();

    dbManager.getDBUserData(username, (err, rowCount, fields) => {
      if (rowCount === 1) {
        var field = fields[0];
        const ret_password = field[2].value;
        const ret_role = field[1].value;

        //check encrypted password
        if (ret_password === encryptedPassword) {
          done(null, {
            name: username, role: ret_role, password: ret_password
          });
        } else {
          done(null, false);
        }
      } else {
        //no user account found, or has returned multiple users which should NOT happen
        done(null, false);
      }
    });
  }
));

app.post('/authenticate', passport.authenticate(  
  'local', {
    session: false
  }), serializeUser, generateToken, returnToken);

// purpose: update or create user data in database and only return user.id
function serializeUser(req, res, next) {  
  db.updateOrCreate(req.user, function(err, user){
    if(err) {return next(err);}
      req.user = {
        name: user.name,
        role: user.role,
        password: user.password
      };
      next();
  });
  next();
}

// purpose: generates a token based on provided user.id; token is set to expire based on expiresIn value
function generateToken(req, res, next) {  
  req.token = jwt.sign({
    name: req.user.name,
    role: req.user.role,
    password: req.user.password
  }, serverSecret, {
    expiresIn : EXPIRY_TIME	// set to expire in 5 minutes
  });
  next(); // pass on control to the next function
}

// purpose: return generated token to caller
function returnToken(req, res) {  
  res.status(SUCCESS).json({
    user: req.user,
    token: req.token
  });
}

const db = {  
  updateOrCreate: function(user, cb){
    // db dummy, we just cb the user
    cb(null, user);
  }
};

//====================================================//
//					Features Endpoints				  //
//====================================================//

//Handle GET requests for base unsecured '/' path 
app.get('/', authenticate, (req, res) => {
	console.log("GET request received for /");
	res.status(SUCCESS).json({"message": "Welcome to LilTim REST-based web service", "links": {"rel" : "authenticate", "href" : "http://localhost:8080/authenticate"}});
})

//Handle POST requests for '/result' path
app.post("/result", authenticate, (req, res) => {
	console.log("POST request received for /result");
	    try {
			  var currentExpression = JSON.stringify(req.body.expression).replace(/\"/g, "");
				var queryString = "SELECT * FROM dbo.Results WHERE InputExpression = '" + currentExpression + "'";
				dbManager.getDBExpressionData(req, res, queryString, currentExpression, 1);
		} catch (err) {
			res.status(BAD_REQUEST).json({error: "Invalid request for results!"});
		}
});

//Handle POST requests for '/postfix' path, only accessible by premium users
app.post("/postfix", authenticate, (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    try {
      if (req.user.role === 'premium') {
        console.log("POST request received for /getPostfix");
        try {
          var currentExpression = JSON.stringify(req.body.expression).replace(/\"/g, "");
          var queryString = "SELECT * FROM dbo.Results WHERE Postfix = '" + currentExpression + "'";
          dbManager.getDBExpressionData(req, res, queryString, currentExpression, 2);

        } catch (err) {
          res.status(BAD_REQUEST).json({error: "Invalid request for postfix!"});
        }
      } 
      else if (req.user.role === 'regular') {
        return res.status(FORBIDDEN).send({
              'status': FORBIDDEN,
              'message': 'You are not a premium user'
            });
      }
    } 
    catch (err) {
      return res.status(UNAUTHORIZED).send({
          'status': UNAUTHORIZED,
          'message': 'An authentication error occurred.',
          }); 
    }
    
     }) (req, res, next);
});