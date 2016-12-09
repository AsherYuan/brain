var mongoose = require('../mongoose.js');

var UserRequestSchema = new mongoose.Schema({
    user_id: String,
    request_str: String,
    requestTime:{type:Date, default:Date.now}
});
var UserRequestModel = mongoose.model("userRequest", UserRequestSchema, "userRequest");
module.exports = UserRequestModel;