var mongoose = require('../mongoose.js');

/* 用户训练库 */
var UserTrainingSchema = new mongoose.Schema({
	userId:String,
	word:String,
	type:String,
	typeTimes:Number,
	subType:String,
	subTypeTimes:Number,
	action:String,
	actionTimes:Number
});
var UserTrainingModel = mongoose.model("userTraining", UserTrainingSchema);
module.exports = UserTrainingModel;