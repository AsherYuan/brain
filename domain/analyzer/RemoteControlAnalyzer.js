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
			var render = function(orderItem) {
            	return new Promise(function(resolve, reject) {
            		UserEquipmentModel.findById(orderItem.deviceId, function(err, ueq) {
            			if(err) {
            				debug('数据库错误:' + JSON.stringify(err));
            				reject(err);
            			} else {
            				orderItem.device = ueq;
            				resolve(orderItem);
            			}
            		});
            	});
	        };
	        var toRandering = [];
	        for (var i=0; i<orderparamlist.length; i++) {
	            toRandering.push(render(orderparamlist[i]));
	        }
	        Promise.all(toRandering).then(function(orderItems) {
	        	debug("orderItems::关联设备信息::" + JSON.stringify(orderItems));
	            callback(null, orderItems);
	        });
		},

		/* 第二步，获取所有设备对应的空调，电视或其他的cac,ctv,cother */
		function(orderItems, callback) {
			if(!!orderItems && orderItems.length > 0) {
				var render = function(orderItem) {
	            	return new Promise(function(resolve, reject) {
	            		var param = {};
	            		var resultOrderEntity;
	            		if(orderItem.deviceType === "空调") {
	            			param.status = orderItem.status;
	            			if(orderItem.status === "开") {
		            			param.model = orderItem.model;
		            			param.ac_windspeed = orderItem.ac_windspeed;
		            			param.ac_temperature = orderItem.ac_temperature;
		            		}
		            		CACModel.findOne(param, function(err, cac) {
		            			if(err || !cac) {
		            				reject(err);
		            			} else {
		            				resultOrderEntity = new ResultOrderModel({
		            					user_id:orderItem.userId,
		            					ueq:orderItem.device,
		            					c_ac:cac
		            				});
		            			}
		            		});
	            		} else if(orderItem.deviceType === "电视") {
	            			//电视
	            			if(!!orderItem.status) {
	            				param.status = orderItem.status;
	            			} else if(!!orderItem.num) {
	            				param.num = orderItem.num;
	            			} else if(!!orderItem.chg_voice) {
	            				param.chg_voice = orderItem.chg_voice;
	            			} else if(!!orderItem.inst) {
	            				param.inst = orderItem.inst;
	            			} else if(!!orderItem.chg_chn) {
	            				param.chg_chn = orderItem.chg_chn;
	            			}
	            			CTVModel.findOne(param, function(err, ctv) {
	            				if(err || !ctv) {
	            					reject(err);
	            				} else {
	            					resultOrderEntity = new ResultOrderModel({
		            					user_id:orderItem.userId,
		            					ueq:orderItem.device,
		            					c_tv:ctv
		            				});
	            				}
	            			});
	            		} else {
	            			param.status = orderItem.status;
	            			COtherModel.findOne(param, function(err, cother) {
	            				if(err || !ctv) {
	            					reject(err);
	            				} else {
	            					resultOrderEntity = new ResultOrderModel({
		            					user_id:orderItem.userId,
		            					ueq:orderItem.device,
		            					c_other:cother
		            				});
								}
	            			});
	            		}

	            		resultOrderEntity.save(function(err, saved) {
        					if(err) {
        						reject(err);
        					} else {
        						orderItem.resultOrder = saved;
        						resolve(orderItem);
        					}
        				});
	            	});
		        };
		        var toRandering = [];
		        for (var i=0; i<orderparamlist.length; i++) {
		            toRandering.push(render(orderparamlist[i]));
		        }
		        Promise.all(toRandering).then(function(orderItems) {
		        	debug("orderItems::保存和关联操作指令::" + JSON.stringify(orderItems));
		            callback(null, orderItems);
		        });
			} else {
				callback(Code.DEVICE.NO_MATCH_DEVICE);
			}
		},

		/* 第三步，获取所有设备对应的空调，电视或其他的cac,ctv,cother */
		function(orderItems, callback) {
			if(!!orderItems && orderItems.length > 0) {
				UserRequestModel.findById(inputstr_id, function(err, ur) {
					if(err || !ur) {
						callback(Code.USER_REQUEST.NO_LAST_REQUEST);
					} else {
						EqOrderUserModel.findOne({user_id:ur.user_id, keyword:ur.request_str}, function(err, eqOrderUser) {
							if(err) {
								callback(Code.DATABASE);
							} else {
								/* 保存学习历史 */
								var learnHistoryEntity = new LearnHistoryModel({
									keyword:ur.request_str,
									ueqo_id:eqOrderUser._id + "",
									user_id:ur.user_id
								});
								learnHistoryEntity.save(function(err, entity) {
									if(err) {
										callback(Code.DATABASE);
									} else {
										var deviceIDRespResultMap = {};
										for(var key in orderItems) {
											deviceIDRespResultMap.put(orderItems[key].deviceId, orderItems[key]);
										}
										if(!!eqOrderUser) {
											EqOrderUserModel.update({_id:eqOrderUser._id}, {$set:{deviceIDRespResultMap:deviceIDRespResultMap}}, function(err, updateStatus) {
												if(err) {
													callback(Code.DATABASE);
												} else {
													callback(null, orderItems);
												}
											});
										} else {
											var eouEntity = new EqOrderUserModel({
												user_id:ur.user_id,
												keyword:ur.request_str,
												deviceIDRespResultMap:deviceIDRespResultMap
											});
											eouEntity.save(function(err, en) {
												if(err) {
													callback(Code.DATABASE);
												} else {
													callback(null, orderItems);
												}
											});
										}
									}
								});
							}
						});
					}
				});
			} else {
				callback(Code.DEVICE.NO_MATCH_DEVICE);
			}
		},

		/* 第三点五步，调整设备的状态 */
		function(ordereItems, callback) {
			// TODO
		},

		/* 第四步，准备返回 */y
		function(orderItems, callback) {
			var render = function(orderItem) {
            	return new Promise(function(resolve, reject) {
            		RDeviceModel.findOne({brand:orderItem.device.pingpai, typeName:orderItem.device.typeName}, function(err, rd) {
            			if(err) {
            				reject(err);
            			} else {
            				if(!rd) {
            					reject("找不到对应设备");
            				} else {
            					var param = {
            						typeID:rd.typeId,
            						inst:orderItem.remoteControlHistory.inst
            					};
            					RinfraredModel.findOne(param, function(err, rinfrared) {
            						if(err) {
            							reject(err);
            						} else {
            							if(!rinfrared) {
            								reject("找不到对应红外码");
            							} else {
            								var infrared = {
            									typeId:rd.typeID,
            									inst:rinfrared.inst,
            									infraredcode:rinfrared.infrared
            								};
            								var orderAndInfrared = {
            									infrared:infrared,
            									order:orderItem.resultOrder
            								};
            								resolve(orderAndInfrared);
            							}
            						}
            					});
            				}
            			}
            		});
            	});
	        };
	        var toRandering = [];
	        for (var i=0; i<orderparamlist.length; i++) {
	            toRandering.push(render(orderparamlist[i]));
	        }
	        Promise.all(toRandering).then(function(orderAndInfrared) {
	        	debug("orderItems::准备返回状态::" + JSON.stringify(orderAndInfrared));
	        	var results = {
	        		iscanlearn:false,
	        		orderAndInfrared:orderAndInfrared
	        	};
	            callback(null, results);
	        });
		}
	], function(err, results) {
		if(err) {
			cb(ResponseUtil.resp(err));
		} else {
			cb(ResponseUtil.resp(Code.OK, results));
		}
	});
};