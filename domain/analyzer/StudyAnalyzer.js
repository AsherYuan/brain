/**
 * 学习模式分析器
 */
var debug = require('debug')('express:brain-analyzer-StudyAnalyzer');
var async = require("async");

/* 数据库 */
var UserRequestModel = require("../../mongodb/models/UserRequestModel");
var EqOrderUserModel = require("../../mongodb/business/EqOrderUserModel");

var CACModel = require("../../mongodb/models/CACModel");
var CTVModel = require("../../mongodb/models/CTVModel");
var COtherModel = require("../../mongodb/models/COtherModel");
var RDeviceModel = require("../../mongodb/models/RDeviceModel");
var RinfraredModel = require("../../mongodb/models/RinfraredModel");

/* 工具类 */
var DateUtil = require("../util/DateUtil");
var ResponseUtil = require("../util/ResponseUtil");

/* 常量 */
var Code = require("../const/Code");

var StudyAnalyzer = module.exports;

/* 新版学习模式 */
StudyAnalyzer.study = function(devicesString, user_id, inputstr_id, cb) {
	async.waterfall([
		/* 第一步，找到用户对应的语句 */
		function(callback) {
			UserRequestModel.findById(inputstr_id, function(err, ur) {
				if(err) {
					debug(err);
					callback(Code.DATABASE);
				} else {
					if(!!ur) {
						callback(null, ur);
					} else {
						callback(Code.USER_REQUEST.NO_LAST_REQUEST);
					}
				}
			});
		},

		/* 第二步，保存用户新的学习库 */
		function(userRequest, callback) {
			var eqUser = new EqOrderUserModel({
				user_id:user_id,
				inputstr_id:inputstr_id,
				keyword:ur.request_str,
				devicesString:devicesString
			});

			eqUser.save(function(err, eq) {
				if(err) {
					debug(err);
					callback(Code.DATABASE);
				} else {
					callback(null);
				}
			});
		},

		/* 第三步，开始准备返回数据,c_ac, c_tv, c_other */
		function(callback) {
			var devices = JSON.parse(devicesString);

			var render = function(device) {
            	return new Promise(function(resolve, reject) {
            		if(device.e_type === "空调") {
            			var param = {
            				status:device.status
            			};
            			if(param.status === "开") {
            				param.model = device.model;
            				param.ac_windspeed = device.ac_windspeed;
            				param.ac_temperature = device.ac_temperature;
            			}
            			CACModel.findOne(param, function(err, cac) {
            				if(err) {
            					reject(err);
            				} else {
            					device.cac = cac;
            					resolve(device);
            				}
            			});
            		} else if(device.e_type === "电视") {
            			CTVModel.findOne({status:device.status}, function(err, ctv) {
            				if(err) {
            					reject(err);
            				} else {
            					device.ctv = ctv;
            					resolve(device);
            				}
            			});
            		} else {
            			COtherModel.findOne({status:device.status}, function(err, cother) {
            				if(err) {
            					reject(err);
            				} else {
            					device.ctv = ctv;
            					resolve(device);
            				}
            			});
            		}
            	});
	        };
	        var toRandering = [];
	        for (var i=0; i<devices.length; i++) {
	            toRandering.push(render(devices[i]));
	        }
	        Promise.all(toRandering).then(function(results) {
	        	debug("devices::准备返回状态::" + JSON.stringify(results));
	            callback(null, results);
	        });
		},

		/* 第四步，最后返回数据 */
		function(devices, callback) {
			/* 开始准备返回数据 */
			var retData = {
				delayDesc:"",
				delayOrder:false,
				inputstr:ur.request_str,
				inputstr_id:inputstr_id,
				iscanlearn:false,
				status:"success"
			};

			var orderAndInfrared = [];
			for(var i=0;i<devices.length;i++) {
				var device = devices[i];
				var order = {};
				order.ueq = device;
				order.describe = "to be setting";
				order.user_id = user_id;
				if(order.ueq.e_type === "空调") {
					order.c_ac = dx.cac;
				} else if(order.ueq.e_type === "电视") {
					order.c_tv = dx.ctv;
				} else if(order.ueq.e_type === "电灯" || order.ueq.e_type === "窗帘") {
					order.c_other = dx.cother;
				}
				var single = {};
				single.order = order;
				orderAndInfrared.push(single);
			}
			retData.orderAndInfrared = orderAndInfrared;
			callback(err, retData);
		}
	], function(err, results) {
		if(err) {
			cb(ResponseUtil.resp(err));
		} else {
			cb(ResponseUtil.resp(Code.OK, results));
		}
	});
};