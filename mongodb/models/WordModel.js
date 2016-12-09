var mongoose = require('../mongoose.js');

var WordSchema = new mongoose.Schema({
	word:String,
	wordLength:Number,
	type:String,
	score:Number,
	addTime:{type:Date,default:Date.now},
	subType:String,
	subScore:Number,
	action:String,
	actionScore:Number,
	autogen:{type:Boolean, default:false}
});
var WordModel = mongoose.model("word", WordSchema);
module.exports = WordModel;
