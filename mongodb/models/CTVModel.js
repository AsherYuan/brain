var mongoose = require('../mongoose.js');

var CTVSchema = new mongoose.Schema({
    describe: String,
    status: String,
    inst:String,
    num: String,
    chg_voice:String,
    chg_chn:String
});
var CTVModel = mongoose.model("c_TV", CTVSchema, "c_TV");
module.exports = CTVModel;