var debug = require('debug')('express:brain-analyzer-RepeatLastAnalyzer');
/* 数据库 */
var UserRequestModel = require("../../mongodb/models/UserRequestModel");

/* 常量JSON数据 */
var RepeatKeyWords = require("../const/RepeatKeyWords");

var RepeatLastAnalyzer = module.exports;

RepeatLastAnalyzer.analyze = function(info, ret_callback, cb) {
	/* 检查是否用户说的是重复上一次操作的话 */
	var flag = false;
	for(var key in RepeatKeyWords) {
		if(info.sentence.indexOf(RepeatKeyWords[key]) > -1) {
			flag = true;
			break;
		}
	}

	if(flag) {
		debug("用户发出了重复上一次操作的指令,开始准备之前的文本,前置操作中的回答类型的不在范围内");
		UserRequestModel.find({user_id:info.userId, isAnswer:false}).sort({requestTime:-1}).limit(10).exec().then(function(lasts) {
			debug(JSON.stringify(lasts));
			if(!!lasts && lasts.length > 0) {
				var flag = false;
				var lastInfo;
				for(var i=0; i<lasts.length;i++) {
					var last = lasts[i];
					if(!!last.request_str && last.request_str.length > 0) {
						flag = true;
						lastInfo = {
							userId:info.userId,
							words:last.request_str,
							contextId:info.contextId,
							sentence:last.request_str
						};
						break;
					}
				}
				if(flag) {
					debug("发现之前的前置语句，整理后新的请求为:" + JSON.stringify(lastInfo));
					cb(null, lastInfo, ret_callback);
				} else {
					cb(null, info, ret_callback);
				}
			} else {
				debug("直接后续" + JSON.stringify(info));
				cb(null, info, ret_callback);
			}
		}).catch(function(err) {
			cb(null, info, ret_callback);
		});
	} else {
		cb(null, info, ret_callback);
	}
};
