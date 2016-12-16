/**
 * 核心业务逻辑入口
 */
var Code = require("./const/Code");
var async = require("async");
/* express 自带debug系统 */
var debug = require('debug')('express:brain-core');
/* 文智分词工具 */
var WenzhiUtil = require("./util/WenzhiUtil");

/* 目标分析器 */
var TargetAnalyzer = require("./analyzer/TargetAnalyzer");
var TargetLogicAnalyzer = require("./analyzer/TargetLogicAnalyzer");
var ContextAnalyzer = require("./analyzer/ContextAnalyzer");
var TvShowAnalyzer = require("./analyzer/TvShowAnalyzer");
var UserPrivateAnalyzer = require("./analyzer/UserPrivateAnalyzer");
var RepeatLastAnalyzer = require("./analyzer/RepeatLastAnalyzer");
/* 数据准备器 */
var DataPrepare = require("./prepare/DataPrepare");
var ResponsePrepare = require("./prepare/ResponsePrepare");
var TuringPrepare = require("./prepare/TuringPrepare");

/* 工具类 */
var DateUtil = require("./util/DateUtil");

var Core = module.exports;

/* 程序主入口 */
Core.analyze = function(userId, words, contextId, ret_callback) {
	debug("userId:" + userId);
	debug("words:" + words);
	debug("contextId:" + contextId);
	words = words.replace("我是", "卧室");
	var info = {
		userId:userId,
		words:words,
		contextId:contextId,
		sentence:words
	};
	async.waterfall([
		/* 初始化阶段，后续需要加载的数据,包含如下: 文智分词处理 */
		function(callback) {
			if(!!info.contextId) {
				
			} else {
				
			}
			callback(null, info, ret_callback);
		},
		/* 检查用户是否说的是重复上一次操作的相关问题 */
		RepeatLastAnalyzer.analyze,
		/* 开始准备数据 用户相关基础数据 整合到info对象中，以便于后续分析 */
		DataPrepare.prepare,
		/* 用户学习的独立库 */
		UserPrivateAnalyzer.analyze,
		/* 电视节目分析器 */
		TvShowAnalyzer.analyze,
		/* 目标设备分析器 */
		TargetAnalyzer.analyze,
		/* 目标设备逻辑分析 */
		TargetLogicAnalyzer.analyze,
		/* 上下文分析 */
		ContextAnalyzer.analyze,
		/* 响应准备 */
		ResponsePrepare.prepare,
		/* 图灵流程 */
		TuringPrepare.prepare
	], function (err, result) {
		// debug("流程结束最终返回结果:" + JSON.stringify(result) + "____" + DateUtil.now());
	   	ret_callback(result);
	});
};