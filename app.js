var express = require("express");
var app = express();

var bodyParser = require("body-parser");
var methodOverride = require("method-override");

var expressSanitizer = require("express-sanitizer");


var mongoose = require("mongoose");


mongoose.connect("mongodb://localhost/blog_test");
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());

app.use(methodOverride("_method"));
app.set('port', 3000);

// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});

var Blog = mongoose.model("Blog", blogSchema);

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

    Blog.find({}, function(err, blogs) {
       if(err) {
           console.log("Error!");
       } else {
           res.render("index", {blogs: blogs});
       }
    });

});

// NEW ROUTE
app.get("/blogs/new", function(req, res) {
   res.render("new");
});


// CREATE ROUTE
app.post("/blogs", function(req,res) {

   // sanitize input
   req.body.blog.body = req.sanitize(req.body.blog.body);

   // create blog post
   Blog.create(req.body.blog, function(err, newBlog) {
       if(err) {
           res.render("new");
       } else {
           // redirect to index if new post created successfully
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
app.get("/blogs/:id/edit", function(req, res){



    Blog.findById(req.params.id, function(err, foundBlog) {
        if(err) {
            res.redirect("/blogs");
        } else {
            res.render("edit", {blog: foundBlog})
        }
    });


});

// UPDATE ROUTE
app.put("/blogs/:id", function(req, res) {

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
app.delete("/blogs/:id", function(req, res) {
   Blog.findByIdAndRemove(req.params.id, function(err) {
      if(err) {
          res.redirect("/blogs");
      } else {
          res.redirect("/blogs");
      }
   });
});

// app.listen(process.env.PORT, process.env.IP, function() {
//    console.log("success");
// });

app.listen(app.get('port'), function(){
  console.log('App started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});



