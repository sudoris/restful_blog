var express = require("express");
var app = express();
var mongoose = require("mongoose");
var passport = require('passport');
var LocalStrategy = require("passport-local");

var bodyParser = require("body-parser");
var methodOverride = require("method-override");

var expressSanitizer = require("express-sanitizer");
var User = require("./models/user");
var Blog = require("./models/blog");


mongoose.connect("mongodb://localhost/blog_test");
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());

app.use(methodOverride("_method"));
app.set('port', 3000);

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "SuperSecretWord",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// Blog.create({
//   title: "Test post",
//   image: "https://vignette.wikia.nocookie.net/finalfantasy/images/3/3f/FFIX-Chocobo.png/revision/latest?cb=20130320222331",
//   body: "This is a test blog post"
// });


// RESTFUL ROUTES

app.get("/", function(req, res) {
   res.redirect("/blogs");
});

// INDEX ROUTE
app.get("/blogs", function(req, res) {
    // documentation on sorting mongodb query results 
    // https://docs.mongodb.com/manual/reference/method/cursor.sort/

    // stackoverflow response to sorting mongodb query results with node.js
    // https://stackoverflow.com/questions/5825520/in-mongoose-how-do-i-sort-by-date-node-js/15081087#15081087

    Blog.find({}, function(err, blogs) {
       if(err) {
           console.log("Error!");
       } else {


          // console.log("======= before sort ==========")
          // console.log(blogs);

          // console.log("======= after ======== ");

          // console.log(blogs.sort([['date', 1]]));

          console.log(blogs.sort(function(a, b) {
            return b.created - a.created;
          }));


          res.render("index", {blogs: blogs});
       }
    });

});

// NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res) {
   res.render("new");
});


// CREATE ROUTE
app.post("/blogs", isLoggedIn, function(req,res) {

   // sanitize input
   req.body.blog.body = req.sanitize(req.body.blog.body);

   // create blog post
   Blog.create(req.body.blog, function(err, newBlog) {
       if(err) {
           res.render("new");
       } else {
           // new post created successfully
           // add username and id to blog
           console.log("post created by" + req.user.username);
           //save 
           newBlog.author.id = req.user._id;
           newBlog.author.username = req.user.username;
           newBlog.save();

           console.log(newBlog);

           // redirect to index 
           res.redirect("/blogs");
       }
   });


});

// SHOW ROUTE
app.get("/blogs/:id", function(req, res) {
    Blog.findById(req.params.id, function(err, postFound) {
       if(err) {
           res.redirect("/blogs");
       } else {
           res.render("show", {blog: postFound});
       }
    });

});

// EDIT ROUTE
app.get("/blogs/:id/edit", checkBlogOwnership, function(req, res){

    
    Blog.findById(req.params.id, function(err, foundBlog) {   
        res.render("edit", {blog: foundBlog}); 
    });      
     
});

// UPDATE ROUTE
app.put("/blogs/:id", checkBlogOwnership, function(req, res) {

    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedPost) {
        if(err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});


// DELETE ROUTE
app.delete("/blogs/:id", checkBlogOwnership, function(req, res) {
   Blog.findByIdAndRemove(req.params.id, function(err) {
      if(err) {
          res.redirect("/blogs");
      } else {
          res.redirect("/blogs");
      }
   });
});

// AUTH ROUTES

// show register form
app.get("/register", function(req, res) {
  res.render("register");
});

// sign up handler
app.post("/register", function(req, res) {
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/blogs");
    });
  });
});

// logout route
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/blogs");
});

// show login form
app.get("/login", function(req, res) {
  res.render("login");
});

// handle login
app.post("/login", passport.authenticate("local", 
  {
    successRedirect: "/blogs",
    failureRedirect: "/login"
  }), function(req, res) {
  
});

// middleware authenticate user
function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

//middleware to authenticate and authorize user
function checkBlogOwnership(req, res, next) {
  if(req.isAuthenticated()) {
      Blog.findById(req.params.id, function(err, foundBlog) {
          if(err) {
              res.redirect("back");
          } else {

              if(foundBlog.author.id.equals(req.user._id)) {
                  next();
              } else {
                  res.redirect("back");
              }
              
        }
      });
    } else { // if not, redirect
        console.log("You are not currently logged in");
        res.redirect("back");
    }
}




app.listen(app.get('port'), function(){
  console.log('App started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});



