var mongoose = require('../mongoose.js');
var UserLastPositionSchema = new mongoose.Schema({
	userMobile:String,
	homeId:String,
	layerName:String,
	homeGridId:String,
	lastTime:{type:Date,default:Date.now}
});
var UserLastPositionModel = mongoose.model("userLastPosition", UserLastPositionSchema);
module.exports = UserLastPositionModel;