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

var anony_pic="https://miro.medium.com/max/1400/1*l2AFc33U7grIeMML0a0unQ.jpeg"
// initialsing db
main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect(process.env.DB_URI);
  console.log("Database Connected");
  }

// setting up basic requirements
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Setting Session
app.use(expressSession({
    secret: "Our littli secret",
    resave: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
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

const blogSchema=new mongoose.Schema({
  username: {type: String},
  displayPic: {type: String, default: "data:image/jpeg;base64,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"},
  creationDate: {type: String},
  title: {type: String},
  content: {type: String}
})
// blogSchema.plugin(passportLocalMongoose)
blogSchema.plugin(findOrCreate)

const subscriptionSchema=new mongoose.Schema({
  username: {type:String},
  first_name: {type:String},
  last_name: {type: String},
  email: {type:String},
  Address1: {type:String},
  Address2: {type:String},
  Apartment: {type: String},
  


})
subscriptionSchema.plugin(findOrCreate)



// Using Passport
const User= new mongoose.model("User",userSchema);
const Blogger= new mongoose.model("Blogger",blogSchema);
const Subscriber=new mongoose.model("Subscriber",subscriptionSchema);
passport.use(User.createStrategy());
// passport.use(Blogger.createStrategy());

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

app.get('/', async (req, res) => {
  // Query for the data from MongoDB
  const blogger = await Blogger.find({}); 
  
  // Render the template with the data. You might need to change the path to 
  // the EJS file here depending on your file structure
  res.render('index', { Blogger: blogger });
});
      
//       app.get("/",(req,res)=>{
//     res.render("index",{User:userSchema});
// })

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
  if(req.isAuthenticated())res.render("subscription_form");
  
  else res.redirect("login");
})
// app.post("/subscription",(req,res)=>{
//   const blog=new Blogger({
//     username: req.user
//     displayPic: req.,
//     creationDate: String,
//     title: String,
//     content: Str

//   })
// })
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

app.get("/blogs",(req,res)=>{
  res.render("blogs");
  console.log(new Date().toISOString().split('T')[0]);

  let yourDate = new Date()
yourDate.toISOString().split('T')[0]
const offset = yourDate.getTimezoneOffset()
// console.log(offset);
yourDate = new Date(yourDate.getTime() - (offset*60*1000))
console.log(yourDate.toISOString())
// return yourDate.toISOString().split('T')[0]
console.log(User.username);

})
app.post("/blogs",(req,res)=>{
  let yourDate = new Date()
yourDate.toISOString().split('T')[0]
const offset = yourDate.getTimezoneOffset()
yourDate = new Date(yourDate.getTime() - (offset*60*1000))
  // let u=req.user.username;
  const blog=new Blogger({
    username: req.user.username===undefined?"Anonymous"+"~"+ yourDate.getTime(): req.user.username +"~"+ yourDate.getTime(),
  displayPic: req.body.displayPic,
  creationDate: yourDate.toISOString().split('T')[0],
  title: req.body.title,
  content: req.body.content
  })
  blog.save((err)=>{
    if(err){
      console.log(err);
      res.redirect("/blogs");
    }
    else res.redirect("/#blogs");
  });
})
app.post("/subscription",(req,res)=>{
 
  const subs=new Subscriber({
    username: req.user.username,
    first_name: req.body.first,
    last_name: req.body.last,
    email: req.body.email,
    Address1: req.body.add1,
    Address2: req.body.add2
  })
  subs.save();

  // })
  // Subscriber.findOrCreate({username:req.user.username}, function(err, Subscriber, created) {
  //   // created will be true here
  //   console.log('A new subscriber was inserted');
  //   Click.findOrCreate({}, function(err, click, created) {
  //     // created will be false here
  //     console.log('Did not create a new click for "%s"', click.ip);
  //   })
  // });
  
})

app.listen(8000,(req,res)=>{
    console.log("Server is running on port 8000");
})