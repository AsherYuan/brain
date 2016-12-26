var mongoose = require('../mongoose.js');

var LearnHistorySchema = new mongoose.Schema({
    user_id: String,
    keyword: String,
    ueqo_id:String,
    createTime:{type:Date, default:Date.now}
});
var LearnHistoryModel = mongoose.model("learnHistory", LearnHistorySchema);
module.exports = LearnHistoryModel;