/**
 * 上下文分析器
 */
var Code = require("../const/Code");
var ResponseUtil = require("../util/ResponseUtil");
var debug = require('debug')('express:brain-analyzer-ContextAnalyzer');
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

var ContextAnalyzer = module.exports;

ContextAnalyzer.analyze = function(info, ret_callback, cb) {
	debug("开始分析上下文(用户问答相关):" + "____" + DateUtil.now());
	/* 两种情况，第一种，没有上下文，要询问用户，第二种，有上下文，自动选择一个房间 */
	if(!!info.contextId) {
		async.waterfall([
			/* 第一步，查看用户是否有上下文 */
			function(callback) {
				var contextId = info.contextId;
				UserContextModel.findById(contextId, function(err, userContext) {
					if(err) {
						debug(err);
					} else {
						if(!!userContext) {
							if(userContext.answered) {
								callback(null, false, null, null);
							} else {
								callback(null, true, userContext, info.sentence);
							}
						} else {
							callback(null, false, null, null);
						}
					}
				});
			},

			/* 如果有用户回答,根据回答和contextInfo进行新的info处理 */
			/* 先处理数据库数据 */
			function(flag, userContext, sentence, callback) {
				if(flag) {
					var optionList = JSON.parse(userContext.optionList);
					var isAnswer = false;
					var choise;
					for(var i=0;i<optionList.length;i++) {
						if(sentence === optionList[i].name) {
							isAnswer = true;
							choise = optionList[i];
						}
					}
					/* 用户回答了提问 */
					if(isAnswer) {
						/* 把context处理好，把之前其他的问题调整掉 */
						var userMobile = info.user.mobile;
						UserContextModel.update({userMobile:userMobile, answer:null}, {$set:{answered:true, answer:'ignore', answerTime:new Date()}},  { multi: true }, function(err, stat) {
							UserContextModel.update({_id:new Object(userContext._id)}, {$set:{answer:info.sentence, answered:true, answerTime:new Date()}}, function(err, stat) {
								debug("回答更新完成");
								callback(null, isAnswer, userContext, choise);
							});
						});
					} else {
						callback(null, isAnswer, info, null);
					}
				} else {
					callback(null, false, info, null);
				}
			},

			/* 再处理业务逻辑 */
			/* 根据不同房间的回答，来筛选在targetUserEquipments中的不同设备 */
			function(isAnswer, userContext, choise, callback) {
				if(isAnswer) {
					var contextInfo = JSON.parse(userContext.info);
					var tues = contextInfo.targetUserEquipments;
					var ohgs = contextInfo.optionHomeGrids;
					var temp = [];
					for(var i=0; i<tues.length; i++) {
						if(tues[i].homeGridId === (choise._id + "")) {
							temp.push(tues[i]);
						}
					}
					info = contextInfo;
					info.targetUserEquipments = temp;
					info.optionHomeGrids = null;
					info.contextId = null;
					/* 进入后续流程 */
					debug("上下文环节处理好之后的结果:" + JSON.stringify(info.targetUserEquipments));
					callback(null, info);
				} else {
					callback(null, info);
				}
			}
		], function(err, info) {
			cb(null, info, ret_callback);
		});
	} else {
		debug("没有上下文环节，跳过");
		cb(null, info, ret_callback);
	}
};