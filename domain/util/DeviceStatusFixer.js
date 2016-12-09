/**
 * 空调状态计算工具
 */
var debug = require('debug')('express:brain-util-DeviceStatusFixer');

/* 数据库 */
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");

var DeviceStatusFixer = module.exports;

DeviceStatusFixer.fix = function(data) {
	debug(JSON.stringify(data));
	if(!!data && data.length > 0) {
		for(var i=0;i<data.length;i++) {
			var single = data[i];
			var device = single.device;
			if(device.e_type === "空调") {
				UserEquipmentModel.update({_id:new Object(device._id + "")}, {status:single.status,ac_model:single.mode, ac_temperature:single.temperature, ac_windspeed:single.wind}, function(err, updateInfo) {
					if(err) {
						debug(err);
					} else {
						debug(updateInfo);
					}
				});
			} else if(device.e_type === "电视") {
				UserEquipmentModel.update({_id:new Object(device._id + "")}, {status:single.status, tv_ismute:single.mute}, function(err, updateInfo) {
					if(err) {
						debug(err);
					} else {
						debug(updateInfo);
					}
				});
			} else if(device.e_type === "电灯") {
				UserEquipmentModel.update({_id:new Object(device._id + "")}, {status:single.status}, function(err, updateInfo) {
					if(err) {
						debug(err);
					} else {
						debug(updateInfo);
					}
				});
			} else if(device.e_type === "窗帘") {
				UserEquipmentModel.update({_id:new Object(device._id + "")}, {status:single.status}, function(err, updateInfo) {
					if(err) {
						debug(err);
					} else {
						debug(updateInfo);
					}
				});
			}
		}
	}
};