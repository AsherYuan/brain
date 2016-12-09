var WordModel = require("./mongodb/models/WordModel");

var count = 0;

WordModel.find({}, function(err, words) {
	for(var k in words) {
		WordModel.update({_id:new Object(words[k]._id + "")}, {$set:{wordLength:words[k].word.length}}, function(err, updateinfo) {
			if(err) {
				console.log(err);
			} else {
				console.log(updateinfo + "____" + (++count));
			}
		});
	}
})