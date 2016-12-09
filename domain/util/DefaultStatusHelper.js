/**
 * 空调状态计算工具
 */
var debug = require('debug')('express:brain-util-DefaultStatusHelper');

var DefaultStatusHelper = module.exports;

/* 后续要考虑这里设备状态如果多个，并且是不同品牌的问题, 但是在同一个语句中同时出现时，怎么合并状态的问题 */
// TODO
DefaultStatusHelper.getDefault = function(ircodeBase) {
	if(ircodeBase.temperature === 0) {
		ircodeBase.temperature = 26;
	} else {
		if(ircodeBase.temperature > 30) {
			ircodeBase.temperature = 30;
		}
		if(ircodeBase.temperature < 16) {
			ircodeBase.temperature = 16;
		}
	}
	if(ircodeBase.wind > 4) {
		ircodeBase.wind = 4;
	}
	if(ircodeBase.wind < 0) {
		ircodeBase.wind = 0;
	}

	return ircodeBase;
};