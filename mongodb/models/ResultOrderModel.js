var mongoose = require('../mongoose.js');

var ResultOrderSchema = new mongoose.Schema({
    user_id:String,
    describe:String,
    ueq:Object,
    c_ac:Object,
    c_tv:Object,
    c_other:Object
});
var ResultOrderModel = mongoose.model("resultOrder", ResultOrderSchema, "resultOrder");
module.exports = ResultOrderModel;
