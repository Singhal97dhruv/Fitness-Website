require('dotenv').config();
const express=require('express')
const bodyParser=require('body-parser')
const ejs=require('ejs');
const mongoose = require('mongoose');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose')
const expressSession=require('express-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate')
const GithubStrategy = require('passport-github2').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;

const app=express();

// initialsing db
main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb://localhost:27017/Gym');
  }

// setting up basic requirements
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Setting Session
app.use(expressSession({
    secret: "Our littli secret",
    resave: false,
    saveUninitialized: false
}))

//Setting up passport
app.use(passport.initialize());
app.use(passport.session());


//Schema
const userSchema=new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    githubID: String,
    facebookID: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)


// Using Passport
const User= new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

//Serializing and Deserializing passport
    
passport.serializeUser((user,done)=>{
    done(null,user.id);
})
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);
    })
})


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:8000/auth/facebook/callback"
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ facebookID: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new GithubStrategy({
    clientID: process.env.CLIENT_ID_GITHUB,
    clientSecret: process.env.CLIENT_SECRET_GITHUB,
    callbackURL: "http://localhost:8000/auth/github/home",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    // cb(null,profile)
    // const user=new User(
    //     {githubId: profile.id}
    // )
    // user.save();
    User.findOrCreate({ githubID: profile.id }, function (err, user) {
      return cb(err, user);
    }
    );
  }
));

//global middleware
    app.use((req,res,next)=>{
        // res.locals.session=req.session
        res.locals.user=req.user
        next()
      })

      
      
      app.get("/",(req,res)=>{
    res.render("index");
})

app.get("/register",(req,res)=>{
    res.render("register")
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err)return next(err);
        req.session=null;
        res.redirect("/");
    })

})
app.get("/subscription",(req,res)=>{
  res.render("subscription_form");
})
app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/");
            })
            // res.redirect("/");
        }
    });
})


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));
  
    app.get('/auth/google/home', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });
app.get('/auth/facebook',
    passport.authenticate('facebook'));
  
    app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });
app.get('/auth/github',
    passport.authenticate('github', { scope: ['profile'] }));
  
    app.get('/auth/github/home', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

    // const user= new User({
    //     username: req.body.username,
    //     password: req.body.password
    // })
    // user.save((err)=>{
    //     if(err)console.log(err);
    //     else res.redirect("/");
    // });
app.post("/login",(req,res)=>{
      const user= new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user,(err)=>{
        if(err)console.log(err); 
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/");
            })
        }
    })
})
app.listen(8000,(req,res)=>{
    console.log("Server is running on port 8000");
})