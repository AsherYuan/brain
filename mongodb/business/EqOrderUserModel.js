var mongoose = require('../mongoose.js');

var EqOrderUserSchema = new mongoose.Schema({
	user_id:String,
	keyword:String,
	deviceIDRespResultMap:Object
});
var EqOrderUserModel = mongoose.model("eqOrderUser", EqOrderUserSchema, "eqOrderUser");
module.exports = EqOrderUserModel;