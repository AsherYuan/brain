/**
 * 时间日期工具
 */
var Moment = require('moment');
var debug = require('debug')('express:brain-util-DateUtil');


var DateUtil = module.exports;

// 返回当前时间
DateUtil.now = function() {
	return Moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
};

DateUtil.format = function(date) {
	return Moment(date).format("YYYY-MM-DD HH:mm:ss");
};

DateUtil.diff = function(date1, date2) {
	var milliSeconds1 = date1.getTime();
	var milliSeconds2 = date2.getTime();
	var diffMilliSeconds = milliSeconds1 - milliSeconds2;
	var diffSeconds = diffMilliSeconds / 1000;
	var diffMinutes = diffSeconds / 60;
	var abs = Math.abs(diffMinutes);
	return abs;
}