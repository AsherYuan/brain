/**
 * 时间日期工具
 */
var Moment = require('moment');

var DateUtil = module.exports;

// 返回当前时间
DateUtil.now = function() {
	return Moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
};

DateUtil.format = function(date) {
	return Moment(date).format("YYYY-MM-DD HH:mm:ss");
};
