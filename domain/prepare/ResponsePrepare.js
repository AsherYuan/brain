/**
 * 数据准备
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var DateUtil = require("../util/DateUtil");
var WordWeightUtil = require("../util/WordWeightUtil");
var IrCodeFinder = require("../util/IrCodeFinder");
var DeviceStatusFixer = require("../util/DeviceStatusFixer");
var debug = require('debug')('express:brain-prepare-ResponsePrepare');
var async = require("async");

/* 数据库 */
var HomeModel = require("../../mongodb/models/HomeModel");

var ResponsePrepare = module.exports;

// TODO 后续准备缓存化，同时考虑缓存数据的更新
ResponsePrepare.prepare = function(info, ret_callback, cb) {
	debug("开始准备响应准备流程:" + "____" + DateUtil.now());
	/* 之后还要考虑用户状态跟着走 TODO */
	/* 如果有多个选项，则询问用户，否则进入命令执行阶段 */
	if(info.optionHomeGrids && info.optionHomeGrids.length > 1) {
		var optionList = [];
		var msg = "请选择哪个位置的设备:";
		for(var i=0;i<info.optionHomeGrids.length;i++) {
			var homeGrid = info.optionHomeGrids[i];
			var option = {};
			option = "<a href='" + homeGrid.name + "'>" + homeGrid.name + "</a>";
			optionList.push(option);
			if(i === 0) {
				msg += option;
			} else {
				msg += " | " + option;
			}
		}
		/* 返回给用户 */
		var data = {};
		data.delayDesc = "";
		data.delayOrder = false;
		data.optionList = optionList;
		data.inputstr = info.sentence;
		data.inputstr_id = info.inputstr_id;
		data.iscanlearn = false;
		data.contextId = info.contextId;
		data.status = "success";
		data.msg = msg;

		debug("响应返回给用户:" + JSON.stringify(data));
		ret_callback(ResponseUtil.resp(Code.OK, data));
	} else {
		debug("发现目标设备:" + JSON.stringify(info.targetUserEquipments));
		if(info.targetUserEquipments && info.targetUserEquipments.length > 0 && !!info.words && info.words.length > 0) {
			var target = info.targetUserEquipments;
			WordWeightUtil.subTypesForMulti(info.words, info.commandSentence, target, function(err, data) {
				IrCodeFinder.find(target, data, function(e, d) {
					if(!!e) {
						ret_callback(ResponseUtil.resp(Code.DATABASE));
					} else {
						if(!!d && d.length > 0) {
							var orderAndInfrared = [];
							for(var x=0;x<d.length;x++) {
								var dx = d[x];
								var order = {};
								order.ueq = dx.device;
								order.describe = "to be setting";
								order.user_id = info.user._id + "";
								if(order.ueq.e_type === "空调") {
									order.c_ac = dx.cac;
								} else if(order.ueq.e_type === "电视") {
									order.c_tv = dx.ctv;
								} else if(order.ueq.e_type === "电灯" || order.ueq.e_type === "窗帘") {
									order.c_other = dx.cother;
								}
								var single = {};
								single.order = order;

								var d_infrared = {};
								d_infrared.typeID = dx.ircode.typeID;
								d_infrared.inst = dx.ircode.inst;
								d_infrared.infraredcode = dx.ircode.infrared;
								single.infrared = d_infrared;
								orderAndInfrared.push(single);
							}

							var retData = {};
							retData.delayDesc = "";
							retData.delayOrder = false;
							retData.inputstr = info.inputstr;
							retData.inputstr_id = info.inputstr_id;
							retData.iscanlearn = true;
							retData.orderAndInfrared = orderAndInfrared;
							retData.status = "success";
							/* 修改设备的状态 */
							DeviceStatusFixer.fix(d);
							debug("最终返回数据:" + ResponseUtil.resp(Code.OK, retData));
							ret_callback(ResponseUtil.resp(Code.OK, retData));
						} else {
							debug('没有分析出实际操作，准备进入图灵流程');
							cb(null, info, ret_callback);
						}
					}
				});
			});
		} else {
			debug('没有目标设备发现，准备进入图灵流程');
			cb(null, info, ret_callback);
		}

	}
};
