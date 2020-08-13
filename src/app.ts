import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import bodyParser from 'body-parser';
//import session from 'express-session';
import passport from 'passport';
import session from 'cookie-session';
import fetch from 'node-fetch';
var RedditStrategy = require('passport-reddit').Strategy;
require('dotenv').config();

passport.serializeUser((user,done) => {
  console.log("serial");
  done(null,user);
})

passport.deserializeUser((user, done) => {
  console.log("deserial");
  //console.log(obj);
  done(null,user);
});

passport.use(new RedditStrategy({
  clientID: process.env.REDDIT_KEY,
  clientSecret: process.env.REDDIT_SECRET_KEY,
  callbackURL: "http://127.0.0.1:3000/auth/reddit/callback",
  passReqToCallback:true,
},
(req,accessToken, refreshToken, profile, done) => {
  console.log("access token: ", accessToken);
  console.log("refreshToken: ", refreshToken);
  console.log("profile: ",profile);
  req.session.accessToken = accessToken;

  process.nextTick(function () {
    return done(null,profile);
  });
}));



var app = express();
const port = 3000;


app.use(cors());
app.use(bodyParser.urlencoded({extended: false }));
app.use(session({
  secret: process.env.SUPER_SECRET,
  cookie: {maxAge:3600000}
}))
app.use(passport.initialize());
app.use(passport.session());



//routes
app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!');
});

app.get('/login', (req,res) => {
  res.send('please log in');
});

app.get('/auth/reddit', (req,res,next) => {
  req.session.state = crypto.randomBytes(32).toString('hex');
  passport.authenticate('reddit', {
    state: req.session.state,
  })(req,res,next);
  console.log("session state: " + req.session.state);
  console.log("sessionID: " + req.session.id);
});

app.get('/auth/reddit/callback', function(req,res,next){
  console.log("query state: " + req.query.state);
  console.log("callback session state: " + req.session.state);
  console.log("callback sessionID: " + req.session.id);
  //if(req.query.state == req.session.state){
    console.log("oauth2 works!!!");
    passport.authenticate('reddit',{
      successRedirect:'/',
      failureRedirect:'/login'
    })(req,res,next);
  //}
  /*else {
    //console.log("query state: " + req.query.state);
    //console.log("callback session state: " + req.session.state);
    next( new Error('403'));
  }*/
});

app.get('/api/v1/me', passport.authenticate('reddit'),(req,res) => {
  var oauthLink = 'https://oauth.reddit.com';
  var request = new Request(oauthLink + '/api/v1/me', {
    method:'GET',
    headers: new Headers({
      "Authorization": 'Bearer ' + req.session.accessToken,
      "User-Agent": "DoNotProcrastinateForReddit/0.0.1 by u/UnknownSpark"
    })
  });

  fetch(request).then( (resObj) => {
    return resObj.json();
  }).then( (j) => {
    console.log(j);
  });
});

/*app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});*/

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});