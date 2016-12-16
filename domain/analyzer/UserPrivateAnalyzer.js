/**
 * 用户学习的库
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var debug = require('debug')('express:brain-analyzer-userPrivateAnalyzer');
var DateUtil = require("../util/DateUtil");
var async = require("async");

/* 数据库 */
var EqUserOrderModel = require("../../mongodb/business/EqOrderUserModel");

var UserPrivateAnalyzer = module.exports;

UserPrivateAnalyzer.analyze = function(info, ret_callback, cb) {
	var sentence = info.sentence;
	EqUserOrderModel.findOne({keyword:sentence}, function(err, order) {
		if(err) {
			debug(err);
			cb(null, info, ret_callback);
		} else {
			if(!!order) {
				var deviceIDRespResultMap = order.deviceIDRespResultMap;
				if(!!deviceIDRespResultMap) {
					var irs = [];
					for(var key in deviceIDRespResultMap) {
						irs = irs.concat(deviceIDRespResultMap[key].orderAndInfrared);
					}
					var data = {};
					data.orderAndInfrared = irs;
					data.inputstr = info.sentence;
					data.inputstr = info.inputstr_id;
					data.delayOrder = false;
					data.delayDesc = "";
					data.iscanlearn = true;
					data.status = "success";
					// DeviceStatusFixer.fix(d);
					debug(ResponseUtil.resp(Code.OK, data));
					ret_callback(ResponseUtil.resp(Code.OK, data));
				} else {
					cb(null, info, ret_callback);
				}
			} else {
				cb(null, info, ret_callback);
			}
		}
	});
};
