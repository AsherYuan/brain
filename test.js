var WordModel = require("./mongodb/models/WordModel");

// var map = function() {
// 	emit(this._id, this.word);
// };
// var reduce = function(key, values) {
// 	console.log("key::" + key);
// 	console.log("values:" + values);
// 	var results = [];
// 	for(var i in values) {
// 		var v = values[i];
// 		console.log("-------------------------");
// 		console.log(v);
// 		if('我有点冷'.indexOf(v) > -1) {
// 			results.push(v);
// 		}
// 	}
	
// 	return results;
// };

// var o = {};
// o.map = map;
// o.reduce = reduce;

// WordModel.mapReduce(o, reduce, function (err, results) {
//     if(err) {
//         console.log("mapReduce err:"+err);
//     }
//     console.log(JSON.stringify(results));
// });

var o = {};
o.map = function () { emit(this.word, 1) }
o.reduce = function (k, vals) { return vals.length }
WordModel.mapReduce(o, function (err, results) {
  console.log("111111111111111111" + results);
})