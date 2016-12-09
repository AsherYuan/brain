var mongoose = require('../mongoose.js');

var CACSchema = new mongoose.Schema({
    describe: String,
    status: String,
    type: String,
    model:String,
    ac_windspeed:Number,
    ac_temperature:Number,
    inst:String
});
var CACSModel = mongoose.model("c_AC", CACSchema, "c_AC");
module.exports = CACSModel;
