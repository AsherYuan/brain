var mongoose = require('../mongoose.js');
// TODO 用户独立权重池
// 权重值上限100
var WordWeightSchema = new mongoose.Schema({
    word:String,
    weight:Number,
});
var WordWeightModel = mongoose.model("wordWeight", WordWeightSchema);
module.exports = WordWeightModel;