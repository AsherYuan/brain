/**
 * 空调状态计算工具
 */
var debug = require('debug')('express:brain-util-ACStatusHelper');
var DefaultStatusHelper = require("./DefaultStatusHelper");

var ACStatusHelper = module.exports;

/* 后续要考虑这里设备状态如果多个，并且是不同品牌的问题, 但是在同一个语句中同时出现时，怎么合并状态的问题 */
// TODO
ACStatusHelper.calculate = function(newType) {
	var devices = newType.devices;
	var ircodeBase = {
		wind:null,
		temperature:null,
		mode:null,
		status:null,
		tempContext:null,
		windContext:null
	};

	var subTypes = newType.subTypes;
	for(var subKey in subTypes) {
		var actions = subTypes[subKey].actions;
		for(var aKey in actions) {
			if(subKey === "模式") {
				ircodeBase.mode = actions[aKey];
			} else if(subKey === "风速") {
				ircodeBase.wind = actions[aKey];
			} else if(subKey === "温度") {
				ircodeBase.temperature = actions[aKey];
			} else if(subKey === "状态") {
				ircodeBase.status = actions[aKey];
			} else if(subKey === "温度上下文") {
				ircodeBase.tempContext = actions[aKey];
			} else if(subKey === "风速上下文") {
				ircodeBase.windContext = actions[aKey];
			}
		}
	}

	var d;
	for(var i=0;i<devices.length;i++) {
		if(devices[i].e_type == "空调") {
			d = devices[i];
			break;
		}
	}
	ircodeBase.device = d;

	if(!ircodeBase.wind) {
		ircodeBase.wind = d.ac_windspeed;
	}

	if(!ircodeBase.temperature) {
		ircodeBase.temperature = d.ac_windspeed;
	}

	if(!ircodeBase.mode) {
		ircodeBase.mode = d.ac_model;
	}

	if(!ircodeBase.status) {
		ircodeBase.status = d.status;
	}

	if(!!ircodeBase.tempContext) {
		var wd = parseInt(ircodeBase.temperature) + parseInt(ircodeBase.tempContext);
		if(wd > 30) {
			wd = 30;
		}
		if(wd < 16) {
			wd = 16;
		}
		ircodeBase.temperature = wd;
	}

	if(!!ircodeBase.windContext) {
		var fs = parseInt(ircodeBase.wind) + parseInt(ircodeBase.windContext);
		if(fs > 4) {
			fs = 4;
		}
		if(fs < 0) {
			fs = 0;
		}
		ircodeBase.wind = fs;
	}

	ircodeBase = DefaultStatusHelper.getDefault(ircodeBase);
	return ircodeBase;
};