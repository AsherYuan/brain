/**
 * 目标逻辑方面的分析器
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var debug = require('debug')('express:brain-analyzer-tvShowAnalyzer');
var DateUtil = require("../util/DateUtil");
var async = require("async");
var WordWeightUtil = require("../util/WordWeightUtil");

/* 数据库 */
var TvChannelModel = require("../../mongodb/tv/TvChannelModel");
var TvProgramModel = require("../../mongodb/tv/TvProgramModel");
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");
var RDeviceModel = require("../../mongodb/models/RDeviceModel");
var RinfraredModel = require("../../mongodb/models/RinfraredModel");
var CTVModel = require("../../mongodb/models/CTVModel");

var TvShowAnalyzer = module.exports;

TvShowAnalyzer.analyze = function(info, ret_callback, cb) {
	/* 如果是上下文，不做任何处理,跳过 */
	if(!!info.contextId) {
		cb(null, info, ret_callback);
	} else {
		debug("开始用户文本分析是否用于电视操作:" + "____" + DateUtil.now());
		if(info.sentence.indexOf("我要看") === 0) {
			var channel = info.sentence.replace("我要看", "");
			async.waterfall([
				/* 第一步 查看是否是电视台操作 */
				function(callback) {
					var leftWords = info.sentence.replace("我要看", "");
					/* 查找数据库中名称为关键词的，或者别名中有该关键词的条目 */
					TvChannelModel.find({}, function(err, channels) {
						if(err) {
							debug(err);
						} else {
							var target;
							for(var i=0;i<channels.length;i++) {
								var c = channels[i];
								if(c.channel === leftWords) {
									target = c;
									break;
								} else {
									if(!!c.alias) {
										var as = c.alias.split(",");
										for(var j=0;j<as.length;j++) {
											if(as[j] === leftWords) {
												target = c;
												break;
											}
										}
									}
								}
							}
							callback(null, target, info);
						}
					});
					
				},
				/* 如果有多个房间的设备---进入询问环节，如果没有设备--进入图灵,如果同个房间的设备--进入红外码环节 */
				function(target, info, callback) {
					if(!!target) {
						callback(null, target, info);
					} else {
						// TODO 查找电视节目
						var leftWords = info.sentence.replace("我要看", "");
						var now = new Date();
						TvProgramModel.find({$and:[{beginTime:{$lt:now}}, {endTime:{$gt:now}}]}, function(err, programs) {
							if(err) {
								callback(err);
							} else {
								var tp;
								if(!!programs && programs.length > 0) {
									for(var i=0;i<programs.length;i++) {
										var p = programs[i];
										if(p.program.indexOf(leftWords) > -1) {
											tp = p;
										}
									}
									// TODO 存在多个的情况
									if(!!tp) {
										TvChannelModel.findById(tp.channelId, function(terr, channel) {
											callback(null, channel, info);
										});
									} else {
										callback(null, target, info);
									}
								} else {
									callback(null, target, info);
								}
							}
						});
					}
				}, 

				/* 发送红外码 */
				function(target, info, callback) {
					if(!!target && !!target.channelNum) {
						debug("channelNum:" + target.channelNum);
						var channelNum = parseInt(target.channelNum);
						var hundred = 0;
						var ten = 0;
						var one = 0;
						if(channelNum > 100) {
							hundred = Math.floor(channelNum / 100);
							ten = Math.floor((channelNum - (hundred * 100)) / 10);
							one = channelNum % 10;
						} else {
							ten = Math.floor(channelNum / 10);
							one = channelNum % 10;
						}
						var buttons = [];
						if(hundred > 0) {
							buttons.push("T_D" + hundred);
						}
						if(ten > 0) {
							buttons.push("T_D" + ten);
						}
						buttons.push("T_D" + one);


						UserEquipmentModel.findById('586601de887b1945e182e186', function(err, ueq) {
							if(err) {
								debug(err);
								callback(null, info);
							} else {
								var typeName = ueq.typeName;
								RDeviceModel.findOne({typeName:typeName}, function(err1, rd) {
									if(err1) {
										debug(err1);
										callback(null, info);
									} else {
										var typeID = rd.typeID;
										debug("buttons:" + JSON.stringify(buttons));
										CTVModel.find({inst:{$in:buttons}}, function(err2, ctvs) {
											if(err2) {
												debug(err2);
												callback(null, info);
											} else {
												var irs = [];
												var newArray = [];
												for(var i=0;i<buttons.length;i++) {
													for(var j=0;j<ctvs.length;j++) {
														if(buttons[i] === ctvs[j].inst) {
															newArray.push(ctvs[j]);
														}
													}
												}
												// 排序
												ctvs = newArray;
												debug("newCtvs:::" + JSON.stringify(ctvs));

												if(ctvs.length === 3) {
													RinfraredModel.findOne({typeID:typeID, inst:ctvs[0].inst}, function(err3, hir) {
														RinfraredModel.findOne({typeID:typeID, inst:ctvs[1].inst}, function(err4, tir) {
															RinfraredModel.findOne({typeID:typeID, inst:ctvs[2].inst}, function(err5, oir) {
																var order = {};
																order.ueq = ueq;
																order.c_tv = ctvs[0];
																order.describe = 'tv channel op';
																order.user_id = info.userId;
																var o1 = {};
																o1.order = order;
																o1.infrared = {
																	typeID:hir.typeID,
																	inst:hir.inst,
																	infraredcode:hir.infrared
																};
																irs.push(o1);

																order = {};
																order.ueq = ueq;
																order.c_tv = ctvs[1];
																order.describe = 'tv channel op';
																order.user_id = info.userId;
																var o2 = {};
																o2.order = order;
																o2.infrared = {
																	typeID:tir.typeID,
																	inst:tir.inst,
																	infraredcode:tir.infrared
																};
																irs.push(o2);

																order = {};
																order.ueq = ueq;
																order.c_tv = ctvs[2];
																order.describe = 'tv channel op';
																order.user_id = info.userId;
																var o3 = {};
																o3.order = order;
																o3.infrared = {
																	typeID:oir.typeID,
																	inst:oir.inst,
																	infraredcode:oir.infrared
																};
																irs.push(o3);
																// 三位数的号码，不需要再加确认
																// irs.push(addConfirm(irs));
																callback(null, irs, info);
															});
														});
													});
												} else if(ctvs.length === 2) {
													RinfraredModel.findOne({typeID:typeID, inst:ctvs[0].inst}, function(err6, tir) {
														RinfraredModel.findOne({typeID:typeID, inst:ctvs[1].inst}, function(err7, oir) {
															var order = {};
															order.ueq = ueq;
															order.c_tv = ctvs[0];
															order.describe = 'tv channel op';
															order.user_id = info.userId;
															var o1 = {};
															o1.order = order;

															debug(JSON.stringify(tir));
															o1.infrared = {
																typeID:tir.typeID,
																inst:tir.inst,
																infraredcode:tir.infrared
															};
															irs.push(o1);

															order = {};
															order.ueq = ueq;
															order.c_tv = ctvs[1];
															order.describe = 'tv channel op';
															order.user_id = info.userId;
															var o2 = {};
															o2.order = order;
															o2.infrared = {
																typeID:oir.typeID,
																inst:oir.inst,
																infraredcode:oir.infrared
															};
															irs.push(o2);
															irs.push(addConfirm(irs));
															callback(null, irs, info);
														});
													});
												} else {
													RinfraredModel.findOne({typeID:typeID, inst:ctvs[0].inst}, function(err8, oir) {
														var order = {};
														order.ueq = ueq;
														order.c_tv = ctvs[0];
														order.describe = 'tv channel op';
														order.user_id = info.userId;
														var o1 = {};
														o1.order = order;
														o1.infrared = {
															typeID:oir.typeID,
															inst:oir.inst,
															infraredcode:oir.infrared
														};
														irs.push(o1);
														irs.push(addConfirm(irs));
														callback(null, irs, info);
													});
												}
											}
										});
									}
								});
							}
						});	
					} else {
						callback(null, null, info);
					}
				},

				function(irs, info, callback) {
					debug(JSON.stringify(irs));
					if(!!irs && irs.length > 0) {
						var data = {};
						data.delayDesc = "";
						data.delayOrder = false;
						data.inputstr = info.sentence;
						data.inputstr_id = info.inputstr_id;
						data.iscanlearn = false;
						data.status = "success";
						data.orderAndInfrared = irs;

						ret_callback(ResponseUtil.resp(Code.OK, data));
					} else {
						data = {};
						data.delayDesc = "";
						data.delayOrder = false;
						data.inputstr = "暂时没有电视台在播放您要看的节目";
						data.inputstr_id = info.inputstr_id;
						data.iscanlearn = false;
						data.status = "success";
						data.orderAndInfrared = irs;

						ret_callback(ResponseUtil.resp(Code.OK, data));
					}
				}
			], function(err, info) {
				cb(null, info, ret_callback);
			});
		} else {
			/* 直接返回开始后续操作 */
			cb(null, info, ret_callback);
		}
	}
};

var addConfirm = function(irs) {
	var ueq = irs[0].order.ueq;
	var c_tv = {
	    "describe" : "确认按钮",
	    "inst" : "T_OK"
	};
	var user_id = irs[0].order.user_id;
	var describe = irs[0].order.describe;
	var order = {
		ueq:ueq,
		c_tv:c_tv,
		describe:describe,
		user_id:user_id
	};
	var infrared = {
		typeID: "800000",
      	inst: "T_OK",
      	infraredcode: "36 FF FF 80 55 15 51 11 44 44 51 11 15 45 54 44 40 00 00 00 00 00 00 00 00 0F FF F8"
	};
	var ir = {
		order:order,
		infrared:infrared
	};
	return ir;
};