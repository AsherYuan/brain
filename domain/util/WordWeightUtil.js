// var http = require('http');
var debug = require('debug')('express:brain-util-WordWeightUtil');
var async = require("async");

/* 数据库 */
var WordModel = require("../../mongodb/models/WordModel");

/* 文智分词工具 */
var WenzhiUtil = require("./WenzhiUtil");

/* 工具类 */
var DateUtil = require("./DateUtil");

var WordWeightUtil = module.exports;

// 如果最后得分太低，需要根据设置的值，判断是否需要询问用户确认 比如50分以下，说明相关程度不高
WordWeightUtil.mainType = function (word, cb) {
	WordModel.find({word:word}, function(err, words) {
		if(err) {
			cb(err);
		} else {
			if(!!words && words.length > 0) {
				var types = {};
				/* 累加数据 */
				for(var i=0;i<words.length;i++) {
					var type = words[i].type;
					var score = words[i].score;
					if(!!types[type]) {
						types[type].score += score;
					} else {
						types[type] = score;
					}
				}
				/* 计算设备 */
				var topScore = 0;
				var finalTypes = {};

				for(var key in types) {
					var individualScore = types[key];
					if(individualScore > topScore) {
						topScore = individualScore;
						finalTypes = {};
						finalTypes[key] = individualScore;
					} else if(individualScore === topScore) {
						finalTypes[key] = individualScore;
					}
				}
				debug(finalTypes);
				cb(null, finalTypes);
			} else {
				cb(null, null);
			}
		}
	});
};


WordWeightUtil.subTypesForMulti = function(sentence, command, devices, cb) {
	// debug("开始文智平台分析流程:" + "____" + DateUtil.now());
	async.waterfall([
		/* 放弃文智平台，用替换式的方式 */
		// function(callback) {
		// 	WenzhiUtil.separate(command, function(err, sentence, words) {
		// 		if(err) {
		// 			debug("文智平台访问错误:" + err);
		// 		} else {
		// 			var keywords = [];
		// 			for(i=0;i<words.length;i++) {
		// 				debug(JSON.stringify(words[i]));
		// 				keywords.push(words[i].word);
		// 			}
		// 			callback(null, keywords);

		// 		}
		// 	});
		// },

		// function(keywords, callback) {
		// 	/* 查看所有关键词，并且在目标设备的类型范围内 */
		// 	var deviceTypes = [];
		// 	for(var d in devices) {
		// 		deviceTypes.push(devices[d].e_type);
		// 	}
		// 	WordModel.find({word:{$in:keywords}, type:{$in:deviceTypes}}, function(err, words) {
		// 		if(err) {
		// 			callback(err);
		// 		} else {
		// 			var i;
		// 			var types = {};
		// 			var type;
		// 			var score;
		// 			var subType;
		// 			var subScore;
		// 			var action;
		// 			var actionScore;

		// 			/* 过滤掉一模一样的单词，但是用于不同subTypes的，取分值高的 */
		// 			var filterMap = {};
		// 			var filterArray = [];
		// 			var filterHigh = 0;
		// 			for(i=0;i<words.length;i++) {
		// 				var word = words[i].word;
		// 				var type = words[i].type
		// 				if(!filterMap[word + type]) {
		// 					filterMap[word + type] = words[i];
		// 				} else {
		// 					if(words[i].subScore > filterMap[word + type].subScore) {
		// 						filterMap[word + type] = words[i];
		// 					}
		// 				}
		// 			}
		// 			for(var filterKey in filterMap) {
		// 				filterArray.push(filterMap[filterKey]);
		// 			}
		// 			words = filterArray;
		// 			/* 过滤完毕 */
		// 			debug("过滤完的:" + JSON.stringify(words));

		// 			for(i=0;i<words.length;i++) {
		// 				type = words[i].type;
		// 				score = words[i].score;
		// 				if(!types[type]) {
		// 					types[type] = {score:score, subTypes:{}};
		// 				} else {
		// 					types[type] = {score:score + types[type].score, subTypes:{}};
		// 				}
		// 			}

		// 			for(i=0;i<words.length;i++) {
		// 				subType = words[i].subType;
		// 				type = words[i].type;
		// 				subScore = words[i].subScore;
		// 				if(!types[type].subTypes[subType]) {
		// 					types[type].subTypes[subType] = {subScore:subScore, actions:{}};
		// 				} else {
		// 					types[type].subTypes[subType] = {subScore:subScore + types[type].subTypes[subType].subScore, actions:{}};
		// 				}
		// 			}

		// 			for(i=0;i<words.length;i++) {
		// 				type = words[i].type;
		// 				subType = words[i].subType;
		// 				action = words[i].action;
		// 				actionScore = words[i].actionScore;

		// 				if(!types[type].subTypes[subType].actions[action]) {
		// 					types[type].subTypes[subType].actions[action] = {actionScore:actionScore};
		// 				} else {
		// 					types[type].subTypes[subType].actions[action] = {actionScore:actionScore + types[type].subTypes[subType].actions[action].actionScore};
		// 				}
		// 			}
		// 			callback(null, types);
		// 		}
		// 	});
		// }

		function(callback) {
			/* 查看所有关键词，并且在目标设备的类型范围内 */
			var deviceTypes = [];
			for(var d in devices) {
				deviceTypes.push(devices[d].e_type);
			}
			WordModel.find({type:{$in:deviceTypes}}).sort({wordLength:-1}).exec().then(function(words) {
				var i, j;
				/* 抽取有用的words, 相同分数的不同设备同时抽取 */
				var tempWordsArray = [];
				for(i=0;i<words.length;i++) {
					if(command.indexOf(words[i].word) > -1) {
						tempWordsArray.push(words[i]);
						command = command.replace(words[i].word, "");
					}
				}

				/* 检查相同词汇的模式 */
				var temp2 = [];
				for(i=0;i<words.length;i++) {
					for(j=0;j<tempWordsArray.length;j++) {
						if(words[i].word === tempWordsArray[j].word && words[i].type !== tempWordsArray[j].type) {
							/* 如果有更高分的，替换 */
							if(tempWordsArray[j].score < words[i].score) {
								tempWordsArray[j] = words[i];

							/* 如果同分，两者一起加入 */
							} else if(tempWordsArray[j].score === words[i].score) {
								temp2.push(words[i]);
							}
						}
					}
				}
				if(temp2.length > 0) {
					tempWordsArray = tempWordsArray.concat(temp2);
				}

				words = tempWordsArray;
				var types = {};
				var type;
				var score;
				var subType;
				var subScore;
				var action;
				var actionScore;

				/* 查找句子中包含的 */

				/* 过滤掉一模一样的单词，但是用于不同subTypes的，取分值高的 */
				var filterMap = {};
				var filterArray = [];
				var filterHigh = 0;
				for(i=0;i<words.length;i++) {
					var word = words[i].word;
					var type = words[i].type
					if(!filterMap[word + type]) {
						filterMap[word + type] = words[i];
					} else {
						if(words[i].subScore > filterMap[word + type].subScore) {
							filterMap[word + type] = words[i];
						}
					}
				}
				for(var filterKey in filterMap) {
					filterArray.push(filterMap[filterKey]);
				}
				words = filterArray;
				/* 过滤完毕 */
				debug("过滤完的:" + JSON.stringify(words));

				for(i=0;i<words.length;i++) {
					type = words[i].type;
					score = words[i].score;
					if(!types[type]) {
						types[type] = {score:score, subTypes:{}};
					} else {
						types[type] = {score:score + types[type].score, subTypes:{}};
					}
				}

				for(i=0;i<words.length;i++) {
					subType = words[i].subType;
					type = words[i].type;
					subScore = words[i].subScore;
					if(!types[type].subTypes[subType]) {
						types[type].subTypes[subType] = {subScore:subScore, actions:{}};
					} else {
						types[type].subTypes[subType] = {subScore:subScore + types[type].subTypes[subType].subScore, actions:{}};
					}
				}

				for(i=0;i<words.length;i++) {
					type = words[i].type;
					subType = words[i].subType;
					action = words[i].action;
					actionScore = words[i].actionScore;

					if(!types[type].subTypes[subType].actions[action]) {
						types[type].subTypes[subType].actions[action] = {actionScore:actionScore};
					} else {
						types[type].subTypes[subType].actions[action] = {actionScore:actionScore + types[type].subTypes[subType].actions[action].actionScore};
					}
				}
				callback(null, types);
			}).catch(function(err) {
				debug(err);
				callback(err);
			});
		}
	], function(err, result) {
		cb(null, result);
	});
};