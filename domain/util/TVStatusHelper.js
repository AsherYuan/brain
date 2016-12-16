/**
 * 电视状态计算工具
 */
var debug = require('debug')('express:brain-util-TVStatusHelper');

var TVStatusHelper = module.exports;

TVStatusHelper.calculate = function(newType) {
	var devices = newType.devices;
	var ircodeBase = {
		status:null,
		button:null,
		channelContext:null,
		volumnContext:null
	};
	var subTypes = newType.subTypes;
	for(var subKey in subTypes) {
		var actions = subTypes[subKey].actions;
		for(var aKey in actions) {
			if(subKey === "按钮") {
				ircodeBase.button = actions[aKey];
			} else if(subKey === "音量上下文") {
				ircodeBase.volumnContext = actions[aKey];
			} else if(subKey === "频道上下文") {
				ircodeBase.channelContext = actions[aKey];
			} else if(subKey === "状态") {
				ircodeBase.status = actions[aKey];
			}
		}
	}
	var d;
	for(var i=0;i<devices.length;i++) {
		if(devices[i].e_type == "电视") {
			d = devices[i];
			break;
		}
	}

	/* 同步状态 */
	d.status = ircodeBase.status;
	ircodeBase.device = d;
	if(ircodeBase.button === "T_MUTE") {
		ircodeBase.mute = d.tv_ismute === "1" ? "0" : "1";
	}
	return ircodeBase;
};