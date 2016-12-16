/**
 * 目标分析器
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var debug = require('debug')('express:brain-analyzer-targetAnalyzer');
var DateUtil = require("../util/DateUtil");
var async = require("async");

/* 数据库 */
var UserModel = require("../../mongodb/models/UserModel");
var HomeModel = require("../../mongodb/models/HomeModel");
var HomeGridModel = require("../../mongodb/models/HomeGridModel");
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");

/* 常量JSON数据 */
var UserEquipmentType = require("../const/UserEquipmentType");
var UserEquipmentBrand = require("../const/UserEquipmentBrand");

var TargetAnalyzer = module.exports;

TargetAnalyzer.analyze = function(info, ret_callback, cb) {
	/* 如果是上下文，不做任何处理,跳过 */
	if(!!info.contextId) {
		cb(null, info, ret_callback);
	} else {
		debug("开始分析目标设备流程:" + "____" + DateUtil.now());
		if(!!info && !!info.userEquipments && info.userEquipments.length > 0) {
			async.waterfall([
				/* 第一步 确认房型结构 */
				function(callback) {
					var sentence = info.sentence;
					var homes = info.homes;
					var homeGrids = info.homeGrids;
					var userEquipments = info.userEquipments;
					var layers = [];
					for(var h_i in homes) {
						layers = layers.concat(homes[h_i].layers);
					}

					/* 确认用户是否提到了家庭(小区名) */
					var targetHomes = [];
					for(var i=0;i<homes.length;i++) {
						var home = homes[i];
						if(!!home.floorName && sentence.indexOf(home.floorName) > -1) {
							targetHomes.push(home);
							sentence = sentence.replace(home.floorName, "");
						}
					}

					var targetLayers = [];
					for(i=0;i<layers.length;i++) {
						var layer = layers[i];
						if(!!layer.name && sentence.indexOf(layer.name) > -1) {
							targetLayers.push(layer);
							sentence = sentence.replace(layer.name, "");
						}
					}

					/* 确认用户是否提到了房间 */
					var targetHomeGrids = [];
					for(i=0;i<homeGrids.length;i++) {
						var homeGrid = homeGrids[i];
						if(!!homeGrid.name && sentence.indexOf(homeGrid.name) > -1) {
							targetHomeGrids.push(homeGrid);
							sentence = sentence.replace(homeGrid.name, "");
						}
					}

					/* 确认用户是否提到了设备, 这里只关心提到设备 */
					var targetUserEquipments = [];
					for(i=0;i<userEquipments.length;i++) {
						var userEquipment = userEquipments[i];
						if(!!userEquipment.e_name && sentence.indexOf(userEquipment.e_name) > -1) {
							targetUserEquipments.push(userEquipment);
							sentence = sentence.replace(userEquipment.e_name, "");
						}
					}
					callback(null, targetHomes, targetLayers, targetHomeGrids, targetUserEquipments, sentence);
				},

				/* 确认设备范围 */
				function(targetHomes, targetLayers, targetHomeGrids, targetUserEquipments, commandSentence, callback) {
					var hasFiguredUeq = false;
					/* 如果有明确的设备，执行 */
					if(targetUserEquipments.length > 0) {
						hasFiguredUeq = true;
					/* 如果没有明确的设备，根据前置的条件再来分析设备 */
					} else {
						var temp = [];
						var i,j,k;
						/* 通过房间来定位设备 */
						if(targetHomeGrids.length > 0) {
							for(i=0;i<targetHomeGrids.length;i++) {
								temp = temp.concat(targetHomeGrids[i].userEquipments);
							}
							targetUserEquipments = temp;
						} else if(targetLayers.length > 0) {
							for(i=0;i<targetLayers.length;i++) {
								var tempGrids = targetLayers[i].homeGrids;
								for(j=0;j<tempGrids.length;j++) {
									temp = temp.concat(tempGrids[j].userEquipments);
								}
							}
							targetUserEquipments = temp;
						} else if(targetHomes.length > 0) {
							for(i=0;i<targetHomes.length;i++) {
								var tLayers = targetHomes[i].layers;
								for(j=0;j<tLayers.length;j++) {
									var tGrids = tLayers[j].homeGrids;
									for(k=0;k<tGrids.length;k++) {
										temp = temp.concat(tGrids[k].userEquipments);
									}
								}
							}
							targetUserEquipments = temp;
						} else {
							targetUserEquipments = info.userEquipments;
						}
					}
					var param = {};
					param.hasFiguredUeq = hasFiguredUeq;
					param.targetHomes = targetHomes;
					param.targetLayers = targetLayers;
					param.targetHomeGrids = targetHomeGrids;
					param.targetUserEquipments = targetUserEquipments;
					param.commandSentence = commandSentence;
					callback(null, param);
				},

				/* 根据结果再次分析设备 */
				function(param, callback) {
					var i,j,k;
					var hasFiguredUeq = param.hasFiguredUeq;
					var commandSentence = param.commandSentence;
					var tempUserEquipments = param.targetUserEquipments;
					var targetUserEquipments = [];
					if(param.hasFiguredUeq) {
						targetUserEquipments = tempUserEquipments;
					} else {
						/* 检查是否有设备类型 */
						var keyTypes = [];
						for(var key in UserEquipmentType) {
							if(commandSentence.indexOf(key) > -1) {
								keyTypes.push(key);
								commandSentence = commandSentence.replace(key, "");
							} else {
								for(i=0;i<UserEquipmentType[key].length;i++) {
									if(commandSentence.indexOf(UserEquipmentType[key][i]) > -1) {
										keyTypes.push(key);
										commandSentence = commandSentence.replace(key, "");
									}
								}
							}
						}
						/* 检查是否有设备品牌 */
						var keyBrands = [];
						for(key in UserEquipmentBrand) {
							for(i=0;i<UserEquipmentBrand[key].length;i++) {
								if(commandSentence.indexOf(UserEquipmentBrand[key][i]) > -1) {
									keyBrands.push(UserEquipmentBrand[key][i]);
									commandSentence = commandSentence.replace(UserEquipmentBrand[key][i], "");
								}
							}
						}

						if(keyTypes.length > 0 && keyBrands.length > 0) {
							for(i=0;i<keyTypes.length;i++) {
								for(j=0;j<keyBrands.length;j++) {
									for(k=0;k<tempUserEquipments.length;k++) {
										var temp = tempUserEquipments[k];
										if(temp.e_type === keyTypes[i] && temp.pingpai === keyBrands[j]) {
											targetUserEquipments.push(temp);
										}
									}
								}
							}
							hasFiguredUeq = true;
						} else if(keyTypes.length > 0) {
							for(i=0;i<keyTypes.length;i++) {
								for(j=0;j<tempUserEquipments.length;j++) {
									if(tempUserEquipments[j].e_type === keyTypes[i]) {
										targetUserEquipments.push(tempUserEquipments[j]);
									}
								}
							}
							hasFiguredUeq = true;
						} else if(keyBrands.length > 0) {
							for(i=0;i<keyBrands.length;i++) {
								for(j=0;j<tempUserEquipments.length;j++) {
									if(tempUserEquipments[j].pingpai === keyBrands[i]) {
										targetUserEquipments.push(tempUserEquipments[j]);
									}
								}
							}
							hasFiguredUeq = true;
						}
					}
					param.hasFiguredUeq = hasFiguredUeq;
					param.targetUserEquipments = targetUserEquipments;
					param.commandSentence = commandSentence;
					callback(null, param);
				}
			], function(err, param) {
				// debug("目标设备提取流程结束:最终数据:result:" + info);
				info.hasFiguredUeq = param.hasFiguredUeq;
				info.targetHomes = param.targetHomes;
				info.targetLayers = param.targetLayers;
				info.targetHomeGrids = param.targetHomeGrids;
				info.targetUserEquipments = param.targetUserEquipments;
				info.commandSentence = param.commandSentence;
				cb(null, info, ret_callback);
			});
		}  else {
			debug("目标用户没有任何电器设备");
			ret_callback(ResponseUtil.resp(Code.DEVICE.USER_HAS_NO_DEVICE));
		}
	}
};
