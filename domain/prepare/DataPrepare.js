/**
 * 数据准备
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var DateUtil = require("../util/DateUtil");
var debug = require('debug')('express:brain-prepare-DataPrepare');
var async = require("async");

/* 数据库 */
var HomeModel = require("../../mongodb/models/HomeModel");
var UserModel = require("../../mongodb/models/UserModel");
var HomeGridModel = require("../../mongodb/models/HomeGridModel");
var UserEquipmentModel = require("../../mongodb/models/UserEquipmentModel");
var UserRequestModel = require("../../mongodb/models/UserRequestModel");
var UserContextModel = require("../../mongodb/business/UserContextModel");
var AllChecker = require("../util/AllChecker");

/* 常量 */
var BadWords = require("../const/BadWords");

var DataPrepare = module.exports;

// TODO 后续准备缓存化，同时考虑缓存数据的更新
DataPrepare.prepare = function(info, ret_callback, cb) {
	debug("开始准备数据准备流程:" + "____" + DateUtil.now());
	if(!!info && info.userId && !!info.sentence && info.sentence.length > 0) {
		async.waterfall([
			/* 关联用户信息 */
			function(callback) {
				UserModel.findById(info.userId, function(err, user) {
					if(err) {
						ret_callback(ResponseUtil.resp(Code.USER.DATABASE));
					} else {
						if(!!user) {
							callback(null, user);
						} else {
							ret_callback(ResponseUtil.resp(Code.USER.USER_NOT_EXIST));
						}
					}
				});
			},

			/* 关联用户的家庭信息 */
			function(user, callback) {
				HomeModel.find({userMobile:user.mobile}, function(err, homes) {
					if(err) {
						ret_callback(ResponseUtil.resp(Code.USER.DATABASE));
					} else {
						if(!!homes) {
							callback(null, user, homes);
						} else {
							ret_callback(ResponseUtil.resp(Code.HOME.HOME_NOT_EXIST));
						}
					}

				});
			},

			/* 关联到用户的房间信息 */
			function(user, homes, callback) {
				var homeIds = [];
				for(var h_index in homes) {
					homeIds.push(homes[h_index]._id);
				}
				HomeGridModel.find({homeId:{$in:homeIds}}, function(err, homeGrids) {
					if(err) {
						ret_callback(ResponseUtil.resp(Code.USER.DATABASE));
					} else {
						if(!!homeGrids) {
							callback(null, user, homes, homeGrids);
						} else {
							ret_callback(ResponseUtil.resp(Code.HOME.HOMEGRID_NOT_CREATED));
						}
					}
				});
			},

			/* 关联用户的所有设备信息 */
			function(user, homes, homeGrids, callback) {
				var homeIds = [];
				for(var h_index in homes) {
					homeIds.push(homes[h_index]._id);
				}
				UserEquipmentModel.find({home_id:{$in:homeIds}}, function(err, equipments) {
					if(err) {
						ret_callback(ResponseUtil.resp(Code.USER.DATABASE));
					} else {
						settleInfo(info, user, homes, homeGrids, equipments);
						callback(null, info);
					}
				});
			},

			/* 保存用户本次语句 */
			function(info, callback) {
				var entity = new UserRequestModel({
					user_id:info.user._id + "",
					request_str:info.sentence
				});
				entity.save(function(err, ur) {
					if(err) {
						callback(err);
					} else {
						info.inputstr = ur.request_str;
						info.inputstr_id = ur._id + "";
						callback(null, info);
					}
				});
			},

			/* 过滤无意义关键词 */
			function(info, callback) {
				var sentence = info.sentence;
				/* 特殊情况，比如，其他阶段的分析出错，导致sentence为空 */
				if(!!sentence && sentence.length > 0) {
					for(var i in BadWords) {
						sentence = sentence.replace(BadWords[i], "");
					}
					info.sentence = sentence;
				}
				callback(null, info);
			},

			/* 判断用户的文本是否属于回答 */
			function(info, callback) {
				var sentence = info.sentence;
				var now = new Date();
			    var min = now.getMinutes();
			    min = min - 1000;
			    now.setMinutes(min);
			    debug("查找1000分钟以内的所有用户context___"  + DateUtil.format(now));
				var param = {
					userMobile:info.user.mobile,
					answered:false,
					addTime:{"$gte": now}
				};
				UserContextModel.findOne(param).sort({addTime:-1}).exec().then(function(context) {
					debug(JSON.stringify(context));
					debug("....................................................................");
					if(!!context) {
						var opList = JSON.parse(context.optionList);
						var flag = false;
						for(var i=0;i<opList.length;i++) {
							var op = opList[i];
							debug("op.name:" + op.name + "--------------------sentence:::" + sentence);
							if(op.name === sentence) {
								flag = true;
							}
						}

						if(flag) {
							info.contextId = context._id + "";
							debug("info.contextId::" + info.contextId);
							/* 更新本次的用户请求为回答，数据库打上标记 */
							UserRequestModel.update({_id:new Object(info.inputstr_id)}, {$set:{isAnser:true}}, function(err, updateinfo) {
								debug("更新本次的用户请求为回答完成");
							});
						}
						callback(null, info);
					} else {
						callback(null, info);
					}
				}).catch(function(err) {
					debug(err);
					callback(null, info);
				});
			},

			/* 预处理，将灯字替换为电灯 */
			function(info, callback) {
				var sentence = info.sentence;
				var i;
				for(i=0;i<sentence.length - 1; i++) {
					var first = sentence.charAt(i);
					var last = sentence.charAt(i + 1);
					if(last === "灯" && first !== "电") {
						sentence = sentence.replace("灯", "电灯");
						i = i + 1;
					}
				}
				info.sentence = sentence;
				debug("电灯过程:" + info.sentence);
				callback(null, info);
			},

			/* 判断是否要同时操作 */
			function(info, callback) {
				info = AllChecker.check(info);
				callback(null, info);
			}
		], function(err, info) {
			debug("数据准备流程结束:最终数据:result:" + info);
			cb(null, info, ret_callback);
		});
	} else {
		debug("请求参数不正确");
		ret_callback(ResponseUtil.resp(Code.INVALID_PARAM));
	}
};


var settleInfo = function(info, user, homes, homeGrids, userEquipments) {
	user = renderUserObject(user);
	homes = renderHomeObject(homes);
	homeGrids = renderHomeGridObject(homeGrids);
	userEquipments = renderUserEquipmentObject(userEquipments);

	for(var hg_i in homeGrids) {
		var group_u = [];
		for(var ue_i in userEquipments) {
			if(homeGrids[hg_i]._id + "" === userEquipments[ue_i].homeGridId) {
				group_u.push(userEquipments[ue_i]);
			}
		}
		homeGrids[hg_i].userEquipments = group_u;
	}

	for(var h_j in homes) {
		if(!!homes[h_j].layers && homes[h_j].layers.length > 0) {
			for(var l_j in homes[h_j].layers) {
				var group_h = [];
				for(var hg_j in homeGrids) {
					if(homeGrids[hg_j].homeId === (homes[h_j]._id + "") && homeGrids[hg_j].layerName === homes[h_j].layers[l_j].name) {
						group_h.push(homeGrids[hg_j]);
					}
				}
				homes[h_j].layers[l_j].homeGrids = group_h;
			}
		}
	}
	user.homes = homes;
	info.user = user;
	info.homes = homes;
	info.homeGrids = homeGrids;
	info.userEquipments = userEquipments;
};

var renderUserObject = function(user) {
	var wrap = {};
	if(!!user) {
		wrap._id = user._id + "";
		wrap.mobile = user.mobile;
		wrap.username = user.username;
		wrap.password = user.password;
		wrap.lastLoginTime = user.lastLoginTime;
		wrap.regTime = user.regTime;
	}
	return wrap;
};

var renderHomeObject = function(homes) {
	var wrapArray = [];
	if(!!homes && homes.length > 0) {
		for(var h_i in homes) {
			var wrap = {};
			var home = homes[h_i];
			wrap._id = home._id + "";
			wrap.floorName = home.floorName;

			if(!!home.layers) {
				var wrapLayerArray = [];
				for(var i=0;i<home.layers.length;i++) {
					var layer = home.layers[i];
					var layerWrap = {};
					layerWrap.name = layer.name;
					layerWrap.centerBoxSerialno = layer.centerBoxSerialno;
					wrapLayerArray.push(layerWrap);
				}
				wrap.layers = wrapLayerArray;
			}
			wrapArray.push(wrap);
		}
	}
	return wrapArray;
};

var renderHomeGridObject = function(homeGrids) {
	var wrapArray = [];
	if(!!homeGrids && homeGrids.length > 0) {
		for(var h_i in homeGrids) {
			var wrap = {};
			var homeGrid = homeGrids[h_i];
			wrap._id = homeGrid._id + "";
			wrap.homeId = homeGrid.homeId;
			wrap.layerName = homeGrid.layerName;
			wrap.gridType = homeGrid.gridType;
			wrap.name = homeGrid.name;
			wrapArray.push(wrap);
		}
	}
	return wrapArray;
};

var renderUserEquipmentObject = function(userEquipments) {
	var wrapArray = [];
	if(!!userEquipments && userEquipments.length > 0) {
		for(var u_i in userEquipments) {
			var wrap = {};
			var userEquipment = userEquipments[u_i];
			wrap._id = userEquipment._id + "";
			wrap.e_name = userEquipment.e_name;
			wrap.terminalId = userEquipment.terminalId;
			wrap.home_id = userEquipment.home_id;
			wrap.layerName = userEquipment.layerName;
			wrap.homeGridId = userEquipment.homeGridId;
			wrap.e_type = userEquipment.e_type;
			wrap.typeName = userEquipment.typeName;
			wrap.pingpai = userEquipment.pingpai;
			wrap.status = userEquipment.status;
			wrap.ac_model = userEquipment.ac_model;
			wrap.ac_windspeed = userEquipment.ac_windspeed;
			wrap.ac_temperature = userEquipment.ac_temperature;
			wrap.tv_ismute = userEquipment.tv_ismute;
			wrapArray.push(wrap);
		}
	}
	return wrapArray;
};
