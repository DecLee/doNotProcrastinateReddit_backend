"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
//import cookieSession from 'cookie-session';
const node_fetch_1 = __importDefault(require("node-fetch"));
var RedditStrategy = require('passport-reddit').Strategy;
require('dotenv').config();
var userAgent = 'DoNotProcrastinateForReddit/0.0.1 by u/UnknownSpark';
var oauthlink = 'https://oauth.reddit.com';
passport_1.default.serializeUser((user, done) => {
    console.log("serial");
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    console.log("deserial");
    //console.log(obj);
    done(null, user);
});
passport_1.default.use(new RedditStrategy({
    clientID: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET_KEY,
    callbackURL: "http://127.0.0.1:3000/auth/reddit/callback",
    passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => {
    console.log("access token#1: ", accessToken);
    console.log("refreshToken: ", refreshToken);
    //console.log("profile: ",profile);
    //console.log(req.session);
    //req.session.accessToken = accessToken;
    req.session.accessToken = accessToken;
    process.nextTick(function () {
        return done(null, profile);
    });
}));
var app = express_1.default();
const port = 3000;
app.use(cors_1.default());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(express_session_1.default({
    saveUninitialized: false,
    name: 'session',
    secret: process.env.SUPER_SECRET,
    cookie: { maxAge: 60 * 60 * 1000 }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
//routes
app.get('/', (req, res, next) => {
    res.send('The sedulous hyena ate the antelope!');
    /*if(req.session.page_views){
      req.session.page_views++;
      res.send("You visited this page " + req.session.page_views + " times");
   } else {
      req.session.page_views = 1;
      res.send("Welcome to this page for the first time!");
   }*/
    //console.log("req.user: " + JSON.stringify(req.user));
    console.log("isAuthenticated: " + req.isAuthenticated());
    console.log("accessToken: " + req.session.accessToken);
    console.log("req: " + req);
});
app.get('/login', (req, res) => {
    res.send('please log in');
});
app.get('/test', (req, res) => {
    res.send('please log in');
    console.log("sessionState: " + req.session.passport.user);
    console.log("accessToken api/v1/me: " + req.session.accessToken);
});
app.get('/auth/reddit', (req, res, next) => {
    req.session.state = crypto_1.default.randomBytes(32).toString('hex');
    passport_1.default.authenticate('reddit', {
        state: req.session.state,
        scope: ['identity', 'mysubreddits', 'read'],
    })(req, res, next);
    console.log("session state: " + req.session.state);
    console.log("sessionID: " + req.session.id);
    //console.log("sessionReddit: " + req.session.passport.obj);
});
app.get('/auth/reddit/callback', function (req, res, next) {
    console.log("query state: " + req.query.state);
    console.log("callback session state: " + req.session.state);
    console.log("callback sessionID: " + req.session.id);
    //console.log("sessionUser: " + req.user);
    console.log("isAuthenticated: " + req.isAuthenticated());
    //if(req.query.state == req.session.state){
    console.log("oauth2 works!!!");
    passport_1.default.authenticate('reddit', {
        successRedirect: '/',
        failureRedirect: '/login'
    })(req, res, next);
    /*}
    else {
      //console.log("query state: " + req.query.state);
      //console.log("callback session state: " + req.session.state);
      next( new Error('403'));
    }*/
});
app.get('/api/v1/me', (req, res) => {
    console.log("api/v1/me");
    /*var oauthLink = "https://oauth.reddit.com";
    var request = new Request(oauthLink + "/api/v1/me", {
      method:"GET",
      headers: new Headers({
        "Authorization": `bearer ` +req.session.accessToken,
        //'User-Agent': `DoNotProcrastinateForReddit/0.0.1 by u/UnknownSpark`
      })
    });
    console.log("request: " + request);
    fetch(request).then( (resObj) => {
      return resObj.json();
    }).then( (j) => {
      console.log(j);
    });*/
    node_fetch_1.default('https://oauth.reddit.com/api/v1/me', {
        method: 'GET',
        headers: {
            "Authorization": 'bearer ' + req.session.accessToken,
            "User-Agent": userAgent,
        },
    })
        .then(response => response.json())
        .then(data => {
        console.log(JSON.stringify(data, ['features', 'is_employee', 'is_email_permission_required'], '\t'));
    });
    res.redirect('/');
});
app.get('/subreddits/mine/subscriber', (req, res) => {
    console.log("get subreddits of user");
    node_fetch_1.default('https://oauth.reddit.com/subreddits/mine/subscriber', {
        method: 'GET',
        headers: {
            "Authorization": 'bearer ' + req.session.accessToken,
            "User-Agent": userAgent,
        },
    })
        .then(response => response.json())
        .then(data => {
        console.log(JSON.stringify(data, ['data', 'display_name_prefixed', 'children'], '\t'));
    })
        .catch(() => console.log(`Error`));
    res.redirect('/');
});
app.get('/user/subreddits/posts', (req, res) => {
    console.log('Getting list of post from subscribed subreddits');
    node_fetch_1.default(oauthlink + '/r/globaloffensive/hot', {
        method: 'GET',
        headers: {
            "Authorization": 'bearer ' + req.session.accessToken,
            "User-Agent": userAgent,
        },
    })
        .then(response => response.json())
        .then(data => {
        console.log(JSON.stringify(data, ['data', 'children', 'title', 'url', 'author', 'preview', 'images', 'source', 'resolution', 'thumbnail'], '\t'));
    });
    res.redirect('/');
});
app.get('/r/:subreddit/:limit', (req, res) => {
    console.log(JSON.stringify(req.params));
    node_fetch_1.default(oauthlink + '/r/' + req.params.subreddit + '?limit=' + req.params.limit, {
        method: 'GET',
        headers: {
            "Authorization": 'bearer ' + req.session.accessToken,
            "User-Agent": userAgent,
        },
    })
        .then(response => response.json())
        .then(data => {
        console.log(JSON.stringify(data, ['data', 'children', 'title', 'url', 'author', 'preview', 'images', 'source', 'resolution', 'thumbnail', 'stickied'], '\t'));
    });
    res.redirect('/');
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
//# sourceMappingURL=app.js.map