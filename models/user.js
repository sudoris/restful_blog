var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String
});

modules.exports = mongoose.model("User", UserSchema);

