/**
 * 学习模式分析器
 */
var debug = require('debug')('express:brain-analyzer-RemoteControlAnalyzer');
var async = require("async");

/* 数据库 */
var UserModel = require("../../mongodb/models/UserModel");
var HomeModel = require("../../mongodb/models/HomeModel");
var HomeGridModel = require("../../mongodb/models/HomeGridModel");
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");
var UserLastPositionModel = require("../../mongodb/models/UserLastPositionModel");
var UserContextModel = require("../../mongodb/business/UserContextModel");
var CACModel = require("../../mongodb/models/CACModel");
var CTVModel = require("../../mongodb/models/CTVModel");
var COtherModel = require("../../mongodb/models/COtherModel");
var UserRequestModel = require("../../mongodb/models/UserRequestModel");
var EqOrderUserModel = require("../../mongodb/business/EqOrderUserModel");
var LearnHistoryModel = require("../../mongodb/models/LearnHistoryModel");
var RDeviceModel = require("../../mongodb/models/RDeviceModel");
var RinfraredModel = require("../../mongodb/models/RinfraredModel");

/* 工具类 */
var DateUtil = require("../util/DateUtil");
var ResponseUtil = require("../util/ResponseUtil");

/* 常量 */
var Code = require("../const/Code");

var RemoteControlAnalyzer = module.exports;

RemoteControlAnalyzer.remoteControl = function(user_id, deviceId, deviceType, status, model, ac_windspeed, ac_temperature, chg_chn, chg_voice, inst, cb) {
	async.waterfall([
		/* 第一步，准备所有对应的设备 */
		function(callback) {
			UserEquipmentModel.findById(deviceId, function(err, device) {
				if(err) {
					debug(err);
					callback(err);
				} else {
					if(!!device) {
						var updating = {
							status:status,
							model:model,
							ac_windspeed:ac_windspeed,
							ac_temperature:ac_temperature
						};
						UserEquipmentModel.update({_id:new Object(deviceId)}, {$set:updating}, function(err, updateInfo) {
							callback(null, device);
						});
					} else {
						callback(Code.DEVICE.NO_MATCH_DEVICE);
					}
				}
			});
		},

		/* 第二步，获取所有设备对应的空调，电视或其他的cac,ctv,cother */
		function(device, callback) {
			var param = {};
    		var resultOrderEntity;
    		if(deviceType === "空调") {
    			param.status = status;
    			if(param.status === "开") {
        			param.model = model;
        			param.ac_windspeed = ac_windspeed;
        			param.ac_temperature = ac_temperature;
        		}
        		CACModel.findOne(param, function(err, cac) {
        			if(err || !cac) {
        				callback(err);
        			} else {
        				callback(null, device, cac, null, null);
        			}
        		});
    		} else if(deviceType === "电视") {
    			//电视
    			if(!!inst) {
    				param.inst = inst;
    			} else if(!!status) {
    				param.status = status;
    			} else if(!!num) {
    				param.num = num;
    			} else if(!!chg_voice) {
    				param.chg_voice = chg_voice;
    			} else if(!!inst) {
    				param.inst = inst;
    			} else if(!!chg_chn) {
    				param.chg_chn = chg_chn;
    			}
    			CTVModel.findOne(param, function(err, ctv) {
    				if(err || !ctv) {
    					callback(err);
    				} else {
    					callback(null, device, null, ctv, null);
    				}
    			});
    		} else {
    			if(!!inst) {
    				param.inst = inst;
    			} else if(!!status) {
    				param.status = status;
    			}
    			COtherModel.findOne(param, function(err, cother) {
    				if(err || !cother) {
    					callback(err);
    				} else {
    					callback(null, device, null, null, cother);
					}
    			});
    		}
		},

		/* 第三步，准备返回 */
		function(device, cac, ctv, cother, callback) {
			RDeviceModel.findOne({brand:device.pingpai, typeName:device.typeName}, function(err, rd) {
    			if(err) {
    				callback(err);
    			} else {
    				if(!rd) {
    					callback("找不到对应设备");
    				} else {
    					var param = {
    						typeID:rd.typeID
    					};
    					if(!!cac) {
    						param.inst = cac.inst;
    					} else if(!!ctv) {
    						param.inst = ctv.inst;
    					} else if(!!cother) {
    						param.inst = cother.inst;
    					}
    					RinfraredModel.findOne(param, function(err, rinfrared) {
    						if(err) {
    							callback(err);
    						} else {
    							if(!rinfrared) {
    								callback("找不到对应红外码");
    							} else {
									var order = {};
									order.ueq = device;
									order.describe = "to be setting";
									order.user_id = user_id;
									if(order.ueq.e_type === "空调") {
										order.c_ac = cac;
									} else if(order.ueq.e_type === "电视") {
										order.c_tv = ctv;
									} else if(order.ueq.e_type === "电灯" || order.ueq.e_type === "窗帘") {
										order.c_other = cother;
									}
    								var infrared = {
    									typeId:rd.typeID,
    									inst:rinfrared.inst,
    									infraredcode:rinfrared.infrared
    								};
    								var orderAndInfrared = [{
    									infrared:infrared,
    									order:order
    								}];
    								var results = {
						        		iscanlearn:false,
						        		orderAndInfrared:orderAndInfrared
						        	};
						            callback(null, results);
    							}
    						}
    					});
    				}
    			}
    		});
		}
	], function(err, results) {
		if(err) {
			cb(ResponseUtil.resp(err));
		} else {
			cb(null, ResponseUtil.resp(Code.OK, results));
		}
	});
};
