var mongoose = require('../mongoose.js');

var UserContextSchema = new mongoose.Schema({
	userMobile:String,
	addTime:{type:Date, default:Date.now},
	info:String,
	optionList:String,
	answered:{type:Boolean, default:false},
	answer:String,
	answerTime:Date
});
var UserContextModel = mongoose.model("userContext", UserContextSchema);
module.exports = UserContextModel;
