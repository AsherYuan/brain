var mongoose = require('../mongoose.js');

var EqOrderUserSchema = new mongoose.Schema({
	user_id:String,
	inputstr_id:String,
	keyword:String,
	devicesString:String
});
var EqOrderUserModel = mongoose.model("eqOrderUser", EqOrderUserSchema, "eqOrderUser");
module.exports = EqOrderUserModel;