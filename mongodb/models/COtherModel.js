var mongoose = require('../mongoose.js');

var COtherSchema = new mongoose.Schema({
    describe: String,
    status: String,
    inst:String,
    type:String
});
var COtherModel = mongoose.model("c_Other", COtherSchema, "c_Other");
module.exports = COtherModel;