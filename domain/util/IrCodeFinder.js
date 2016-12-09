// var http = require('http');
var debug = require('debug')('express:brain-util-IrCodeFinder');
var async = require("async");

/* 数据库 */
var IrCodeModel = require("../../mongodb/models/RinfraredModel");
var CACModel = require("../../mongodb/models/CACModel");
var CTVModel = require("../../mongodb/models/CTVModel");
var COtherModel = require("../../mongodb/models/COtherModel");
var RDeviceModel = require("../../mongodb/models/RDeviceModel");
var RinfraredModel = require("../../mongodb/models/RinfraredModel");

/* 静态数据 */
var SimilarLimits = require("../const/SimilarLimits");

/* 工具类 */
var DateUtil = require("./DateUtil");
var ACStatusHelper = require("./ACStatusHelper");
var TVStatusHelper = require("./TVStatusHelper");
var LIStatusHelper = require("./LIStatusHelper");
var CUStatusHelper = require("./CUStatusHelper");

var IrcodeFinder = module.exports;

IrcodeFinder.find = function(devices, types, cb) {
	debug("开始查找具体红外码的流程:" + "____" + DateUtil.now());
	async.waterfall([
		function(callback) {
			var key_type;
			var key_subType;
			var key_action;
			var device;
			/* 过滤分数不到的子类别 */
			var newTypes = {};
			for(key_type in types) {
				if(types[key_type].score >= SimilarLimits.TYPE) {
					var newSubTypes = {};
					for(key_subType in types[key_type].subTypes) {
						if(types[key_type].subTypes[key_subType].subScore >= SimilarLimits.SUBTYPE) {
							/* 暂时先不考虑action级别的过滤,只考虑优先级 */
							// var newActions = {};
							// for(key_action in types[key_type].subTypes[key_subType].actions) {
							// 	if(types[key_type].subTypes[key_subType].actions[key_action].actionScore >= SimilarLimits.ACTION) {
							// 		newActions[key_action] = types[key_type].subTypes[key_subType].actions[key_action];
							// 	}
							// }
							// types[key_type].subTypes[key_subType].actions = newActions;
							newSubTypes[key_subType] = types[key_type].subTypes[key_subType];
						}
					}
					types[key_type].subTypes = newSubTypes;
					newTypes[key_type] = types[key_type];
				}
			}
			callback(null, devices, newTypes);
		},

		/* 合并devices 和newTypes,并开始过滤同一grid下的相同品牌的设备 */
		function(devices, newTypes, callback) {
			for(i=0;i<devices.length;i++) {
				device = devices[i];
				if(device.e_type === "空调" && (!!newTypes["空调"])) {
					if(!newTypes['空调'].devices) {
						newTypes["空调"].devices = [device];
					} else {
						newTypes["空调"].devices.push(device);
					}
				} else if(device.e_type === "电视" && (!!newTypes["电视"])) {
					if(!newTypes['电视'].devices) {
						newTypes["电视"].devices = [device];
					} else {
						newTypes["电视"].devices.push(device);
					}
				} else if(device.e_type === "电灯" && (!!newTypes["电灯"])) {
					if(!newTypes['电灯'].devices) {
						newTypes["电灯"].devices = [device];
					} else {
						newTypes["电灯"].devices.push(device);
					}
				} else if(device.e_type === "窗帘" && (!!newTypes["窗帘"])) {
					if(!newTypes['窗帘'].devices) {
						newTypes["窗帘"].devices = [device];
					} else {
						newTypes["窗帘"].devices.push(device);
					}
				}
			}

			/* 去重，TODO 未测试 */
			for(var key in newTypes) {
				var src = newTypes[key].devices;
				var des = [];
				var test = {};
				for(i=0;i<src.length;i++) {
					if(!test[src[i].typeName]) {
						des.push(src[i]);
					}
				}
				newTypes[key].devices = des;
			}
			/* 去重，求最高分值的动作 */
			for(var k in newTypes) {
				var sts = newTypes[k].subTypes;
				for(sk in sts) {
					var as = sts[sk].actions;
					var tempHigh = 0;
					var tempAction = null;
					for(var z in as) {
						if(as[z].actionScore > tempHigh) {
							tempHigh = as[z].actionScore;
							tempAction = z;
						}
					}
					newTypes[k].subTypes[sk].actions = [tempAction];
				}
			}
			callback(null, newTypes);
		},

		/* 根据不同类型来准备 */
		function(newTypes, callback) {
			var i = 0;
			var key_type;
			var key_subType;
			var ircodeBase = {};
			var ircodeBases = [];
			for(key_type in newTypes) {
				if(key_type === "空调") {
					ircodeBase = ACStatusHelper.calculate(newTypes[key_type]);
					ircodeBases.push(ircodeBase);
				} else if(key_type === "电视") {
					ircodeBase = TVStatusHelper.calculate(newTypes[key_type]);
					ircodeBases.push(ircodeBase);
				} else if(key_type === "电灯") {
					ircodeBase = LIStatusHelper.calculate(newTypes[key_type]);
					ircodeBases.push(ircodeBase);
				} else if(key_type === "窗帘") {
					ircodeBase = CUStatusHelper.calculate(newTypes[key_type]);
					ircodeBases.push(ircodeBase);
				} else {
					debug("出现了没有见过的设备类型，请检查数据类型");
				}
			}
			callback(null, newTypes, ircodeBases);
		},

		/* 查找红外码 */
		function(newTypes, irs, callback) {
			var render = function(ib) {
	            return new Promise(function(resolve, reject) {
	            	var param = {};
	            	if(ib.device.e_type === "空调") {
	            		param.status = ib.status;
	            		param.model = ib.mode;
	            		param.type = "基础";
	            		param.ac_windspeed = ib.wind;
	            		param.ac_temperature = ib.temperature;
	            		CACModel.findOne(param, function(err, result) {
	            			if(err) {
	            				debug(err);
	            				reject(err);
	            			} else {
	            				ib.cac = result;
	            				var middleParam = {
	            					typeName:ib.device.typeName,
	            					devType:ib.device.e_type,
	            					brand:ib.device.pingpai
	            				}
	            				RDeviceModel.findOne(middleParam, function(err, rdevice) {
	            					if(err) {
	            						debug(err);
	            						reject(err);
	            					} else {
	            						ib.rdevice = rdevice;
	            						resolve(ib);
	            					}
	            				});
	            			}
	            		});
	            	} else if(ib.device.e_type === "电视") {
	            		param = {};
	            		if(!!ib.status) {
	            			param.status = ib.status;
	            		}
	            		if(!!ib.button) {
	            			param.inst = ib.button;
	            		}

	            		debug("电视的查找参数" + JSON.stringify(param));
	            		CTVModel.findOne(param, function(err, result) {
	            			if(err) {
	            				debug(err);
	            				reject(err);
	            			} else {
	            				ib.ctv = result;
	            				debug("电视的查找ctv" + JSON.stringify(ib));
	            				var middleParam = {
	            					typeName:ib.device.typeName,
	            					devType:ib.device.e_type,
	            					brand:ib.device.pingpai
	            				}
	            				RDeviceModel.findOne(middleParam, function(err, rdevice) {
	            					if(err) {
	            						debug(err);
	            						reject(err);
	            					} else {
	            						ib.rdevice = rdevice;
	            						resolve(ib);
	            					}
	            				});
	            			}
	            		});
	            	} else if(ib.device.e_type === "电灯") {
	            		param = {
	            			type:"电灯"
	            		};
	            		if(!!ib.status) {
	            			param.status = ib.status;
	            		}
	            		
	            		debug("电灯的查找参数" + JSON.stringify(param));
	            		COtherModel.findOne(param, function(err, result) {
	            			if(err) {
	            				debug(err);
	            				reject(err);
	            			} else {
	            				ib.cother = result;
	            				debug("电灯的查找cother" + JSON.stringify(ib));
	            				var middleParam = {
	            					typeName:ib.device.typeName,
	            					devType:ib.device.e_type,
	            					brand:ib.device.pingpai
	            				}
	            				RDeviceModel.findOne(middleParam, function(err, rdevice) {
	            					if(err) {
	            						debug(err);
	            						reject(err);
	            					} else {
	            						ib.rdevice = rdevice;
	            						resolve(ib);
	            					}
	            				});
	            			}
	            		});
	            	} else if(ib.device.e_type === "窗帘") {
	            		param = {
	            			type:"窗帘"
	            		};
	            		if(!!ib.status) {
	            			param.status = ib.status;
	            		}
	            		
	            		debug("窗帘的查找参数" + JSON.stringify(param));
	            		COtherModel.findOne(param, function(err, result) {
	            			if(err) {
	            				debug(err);
	            				reject(err);
	            			} else {
	            				ib.cother = result;
	            				debug("窗帘的查找cother" + JSON.stringify(ib));
	            				var middleParam = {
	            					typeName:ib.device.typeName,
	            					devType:ib.device.e_type,
	            					brand:ib.device.pingpai
	            				}
	            				RDeviceModel.findOne(middleParam, function(err, rdevice) {
	            					if(err) {
	            						debug(err);
	            						reject(err);
	            					} else {
	            						ib.rdevice = rdevice;
	            						resolve(ib);
	            					}
	            				});
	            			}
	            		});
	            	}
	            });
	        };
	        var toRandering = [];
	        for (var i=0; i<irs.length; i++) {
	            toRandering.push(render(irs[i]));
	        }
	        Promise.all(toRandering).then(function(ircodes) {
	            callback(null, ircodes);
	        });
		},

		/* 开始补全所有最后红外码信息 */
		function(ircodes, callback) {
			var render = function(ir) {
	            return new Promise(function(resolve, reject) {
	            	var e_type = ir.device.e_type;
	            	var typeID = ir.rdevice.typeID;
	            	var inst;
	            	if(e_type === "空调") {
	            		inst = ir.cac.inst;
	            	} else if(e_type === "电视") {
	            		inst = ir.ctv.inst;
	            	} else if(e_type === "电灯") {
	            		inst = ir.cother.inst;
	            	} else if(e_type === "窗帘") {
	            		inst = ir.cother.inst;
	            	}
	            	RinfraredModel.findOne({typeID:typeID, inst:inst}, function(err, result) {
	            		if(err) {
	            			reject(err);
	            		} else {
	            			ir.ircode = result;
	            			resolve(ir);
	            		}
	            	});
	            });
	        };
	        var toRandering = [];
	        for (var i=0; i<ircodes.length; i++) {
	            toRandering.push(render(ircodes[i]));
	        }
	        Promise.all(toRandering).then(function(results) {
	        	debug("红外码查找器最后结果:" + JSON.stringify(results));
	            callback(null, results);
	        });
		}
	], function(err, result) {
		cb(null, result);
	});
};