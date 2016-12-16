/**
 * 电灯状态计算工具
 */
var debug = require('debug')('express:brain-util-LIStatusHelper');

var LIStatusHelper = module.exports;

LIStatusHelper.calculate = function(newType) {
	var devices = newType.devices;
	var ircodeBase = {
		status:null
	};
	var subTypes = newType.subTypes;
	var hasStatus = false;
	var status;
	for(var subKey in subTypes) {
		var actions = subTypes[subKey].actions;
		for(var aKey in actions) {
			if(subKey === "状态") {
				ircodeBase.status = actions[aKey];
			}
		}
	}
	var d;
	for(var i=0;i<devices.length;i++) {
		if(devices[i].e_type == "电灯") {
			d = devices[i];
			d.status = ircodeBase.status;
			break;
		}
	}
	/* 同步状态 */
	d.status = ircodeBase.status;
	ircodeBase.device = d;
	return ircodeBase;
};