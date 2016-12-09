/**
 * 目标逻辑方面的分析器
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var debug = require('debug')('express:brain-analyzer-targetLogicAnalyzer');
var DateUtil = require("../util/DateUtil");
var async = require("async");
var WordWeightUtil = require("../util/WordWeightUtil");

/* 数据库 */
var UserModel = require("../../mongodb/models/UserModel");
var HomeModel = require("../../mongodb/models/HomeModel");
var HomeGridModel = require("../../mongodb/models/HomeGridModel");
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");
var UserLastPositionModel = require("../../mongodb/models/UserLastPositionModel");
var UserContextModel = require("../../mongodb/business/UserContextModel");

var TargetLogicAnalyzer = module.exports;

TargetLogicAnalyzer.analyze = function(info, ret_callback, cb) {
	/* 如果是上下文，不做任何处理,跳过 */
	if(!!info.contextId) {
		cb(null, info, ret_callback);
	} else {
		debug("开始根据目标设备范围决定逻辑:" + "____" + DateUtil.now());
		async.waterfall([
			/* 第一步 查看是否有目标设备,没有目标设备，就通过语句分析设备类型后，重新提取 */
			function(callback) {
				var targetUserEquipments = info.targetUserEquipments;

				if(!!targetUserEquipments && targetUserEquipments.length > 0) {
					callback(null);
				} else {
					// 通过名字类型品牌都定位不到具体设备，很可能是没有这些关键词
					// 这里要通过后续的文字来确定设备的类型
					// 分词判断具体是哪些词汇
					var commandSentence = info.commandSentence;
					WordWeightUtil.mainType(commandSentence, function(err, types) {
						if(err) {
							debug(err);
							callback(null);
						} else {
							if(!!types) {
								// 查看符合条件的设备，从所有的设备中
								var tempUserEquipments = [];
								var temp = [];
								var key;
								var keyLayer;
								var keyHome;

								// 如果有目标房间，楼层，或者家庭，过滤设备范围
								if(!!info.targetHomeGrids && info.targetHomeGrids.length > 0) {
									for(key in info.targetHomeGrids) {
										temp = temp.concat(info.targetHomeGrids[key].userEquipments);
									}
									tempUserEquipments = temp;
								} else if(!!info.targetLayers && info.targetLayers.length > 0) {
									for(keyLayer in info.targetLayers) {
										var grids = info.targetLayers[keyLayer].homeGrids;
										for(key in grids) {
											temp = temp.concat(grids[key].userEquipments);
										}
									}
									tempUserEquipments = temp;
								} else if(!!info.targetHomes && info.targetHomes.length > 0) {
									for(keyHome in info.targetHomes) {
										var layers = info.targetHomes[keyHome];
										for(keyLayer in layers) {
											var gs = layers[keyLayer].homeGrids;
											for(key in gs) {
												temp = temp.concat(grids[key].userEquipments);
											}
										}
									}
									tempUserEquipments = temp;
								}

								var resultArray = [];
								for(var i=0;i<tempUserEquipments.length;i++) {
									if(!!types[tempUserEquipments[i].e_type]) {
										resultArray.push(tempUserEquipments[i]);
									}
								}

								info.targetUserEquipments = resultArray;
								callback(null);
							} else {
								callback(null);
							}
						}
					});
				}
			},

			/* 如果有多个房间的设备---进入询问环节，如果没有设备--进入图灵,如果同个房间的设备--进入红外码环节 */
			function(callback) {
				var targetUserEquipments = info.targetUserEquipments;
								debug("targetUserEquipments::" + JSON.stringify(targetUserEquipments));

				var gridIdMap = {};
				var optionHomeGrids = [];
				for(var i=0;i<targetUserEquipments.length;i++) {
					var homeGridId = targetUserEquipments[i].homeGridId;
					if(!gridIdMap[homeGridId]) {
						for(var j=0;j<info.homeGrids.length;j++) {
							if(homeGridId === (info.homeGrids[j]._id + "")) {
								optionHomeGrids.push(info.homeGrids[j]);
								gridIdMap[homeGridId] = 1;
							}
						}
					}
				}
				debug("optionHomeGrids::" + JSON.stringify(optionHomeGrids));
				if(optionHomeGrids.length > 1) {
					info.optionHomeGrids = optionHomeGrids;
					// 准备插入新的Context，然后返回contextId;

					var context = new UserContextModel({
						userMobile:info.user.mobile,
						info:JSON.stringify(info),
						optionList:JSON.stringify(info.optionHomeGrids)
					});

					context.save(function(err, context) {
						if(err) {
							debug("its here");
							debug(err);
						} else {
							info.contextId = context._id;
							callback(null, info);
						}
					});
				} else {
					callback(null, info);
				}
			}
		], function(err, info) {
			cb(null, info, ret_callback);
		});
	}
};