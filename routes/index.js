var express = require('express');
var core = require('../domain/core');

/* 数据库 */
var WordModel = require("../mongodb/models/WordModel");
var UserTrainingModel = require("../mongodb/business/UserTrainingModel");
var debug = require('debug')('express:brain-routes-index');

/* 静态数据 */
var TypeAndSubTypes = require("../domain/const/TypeAndSubTypes");

var router = express.Router();

/* 核心入口区域. */
router.post('/say', function(req, res, next) {
	var userId = req.body.user_id;
	var words = req.body.str;
	var contextId = req.body.contextId;
	core.analyze(userId, words, contextId, function(ret) {
		res.send(ret);
	});
});

/* 学习模块 */
router.post('/remoteControl', function(req, res, next) {
	var user_id = req.body.user_id;
	var deviceId = req.body.deviceId;
	var deviceType = req.body.deviceType;
	var status = req.body.status;
	var model = req.body.model;
	var ac_windspeed = req.body.ac_windspeed;
	var ac_temperature = req.body.ac_temperature;
	var chg_chn = req.body.chg_chn;
	var chg_voice = req.body.chg_voice;
	var inst = req.body.inst;

	core.remoteControl(user_id, deviceId, deviceType, status, model, ac_windspeed, ac_temperature, chg_chn, chg_voice, inst, function(ret) {
		res.send(ret);
	});
});

/* 学习模块 */
// router.post('/study', function(req, res, next) {
// 	var learnParam = req.body.learnParam;
// 	core.study(learnParam, function(ret) {
// 		res.send(ret);
// 	});
// });

/* 新版学习模式 */
router.post("/study", function(req, res, next) {
	var devicesString = req.body.devicesString;
	var user_id = req.body.user_id;
	var inputstr_id = req.body.inputstr_id;

	core.study(devicesString, user_id, inputstr_id, function(ret) {
		res.send(ret);
	});
});

/************************************** 以下为管理界面 *******************************************************/
router.get("/analyze", function(req, res, next) {
	var searchSentence = req.query.searchSentence;
	var sentence = searchSentence;

	if(!!sentence) {
		WordModel.find({}, function(err, words) {
			if(err) {
				debug("/analyze:" + err);
			} else {
				/* 定义结构 */
				var results = {};
				for(var topKey in TypeAndSubTypes) {
					var top = TypeAndSubTypes[topKey];
					results[topKey] = {};
					results[topKey].total = 0;
					results[topKey].average = 0;
					results[topKey].subTypes = {};
					results[topKey].words = [];
				}
				for(topKey in TypeAndSubTypes) {
					for(var subKey in TypeAndSubTypes[topKey]) {
						results[topKey].subTypes[subKey] = {};
						results[topKey].subTypes[subKey].total = 0;
						results[topKey].subTypes[subKey].average = 0;
						results[topKey].subTypes[subKey].words = [];
					}
				}

				/* 提前过滤数据，只处理句子中有包含的数据 */
				var temp = [];
				for(var k in words) {
					var wk = words[k];
					if(sentence.indexOf(wk.word) > -1) {
						temp.push(wk);
					}
				}
				words = temp;
				
				/* 分解数据 */
				for(var i=0;i<words.length;i++) {
					var w = words[i];
					results[w.type].total += w.score;
					results[w.type].words.push(w);
					results[w.type].average = Math.round(results[w.type].total / results[w.type].words.length);
				}
				/* 子类别再处理 */
				for(topKey in results) {
					var totalWords = results[topKey].words;
					for(i=0;i<totalWords.length;i++) {
						var sw = totalWords[i];
						if(sw.subScore > 0) {
							results[topKey].subTypes[sw.subType].total += sw.subScore;
							results[topKey].subTypes[sw.subType].words.push(sw);
							results[topKey].subTypes[sw.subType].average = Math.round(results[topKey].subTypes[sw.subType].total / results[topKey].subTypes[sw.subType].words.length);
						}
					}
				}
				res.render('analyze', {results:results, searchSentence:searchSentence});
			}
		});
	} else {
		res.render('analyze');
	}
});

/* 单个词汇分析 */
router.post("/analyze_word", function(req, res, next) {
	var word = req.body.word;
	WordModel.find({word:word}, function(err, words) {
		debug(JSON.stringify(words));
		/* 定义结构 */
		var results = {};
		for(var topKey in TypeAndSubTypes) {
			results[topKey] = {};
			results[topKey].score = 0;
			results[topKey].subTypes = {};
		}
		
		for(topKey in TypeAndSubTypes) {
			for(var subKey in TypeAndSubTypes[topKey]) {
				results[topKey].subTypes[subKey] = {};
				results[topKey].subTypes[subKey].subScore = 0;
				results[topKey].subTypes[subKey].actions = [];
			}
		}
		/* 准备数据 */
		for(var i in words) {
			results[words[i].type].score += words[i].score;
			results[words[i].type].subTypes[words[i].subType].subScore += words[i].subScore;
			var tempFlag = true;
			for(var x=0;x<results[words[i].type].subTypes[words[i].subType].actions.length;x++) {
				if(words[i].action === results[words[i].type].subTypes[words[i].subType].actions[x].action) {
					tempFlag = false;
					break;
				}
			}
			if(tempFlag) {
				results[words[i].type].subTypes[words[i].subType].actions.push({action:words[i].action, actionScore:words[i].actionScore});
			}
		}
		/* 计算路径 */
		for(var u in results) {
			for(var v in results[u].subTypes) {
				var topActionScore = 0;
				for(var w in results[u].subTypes[v].actions) {
					if(results[u].subTypes[v].actions[w].actionScore > topActionScore) {
						topActionScore = results[u].subTypes[v].actions[w].actionScore;
					}
				}

				for(w in results[u].subTypes[v].actions) {
					if(results[u].subTypes[v].actions[w].actionScore === topActionScore) {
						results[u].subTypes[v].actions[w].isTop = true;
						break;
					}
				}
			}
		}
		res.end(JSON.stringify({word:word, results:results}));
	});
});

/* 训练模块分词库 */
router.get("/tranning_wordlist", function(req, res, next) {
	var sentence = req.query.sentence;
	if(!!sentence) {
		WordModel.find({}, function(err, words) {
			if(err) {
				debug("/analyze:" + err);
			} else {
				/* 提前过滤数据，只处理句子中有包含的数据 */
				var temp = {};
				for(var k in words) {
					var wk = words[k];
					if(sentence.indexOf(wk.word) > -1) {
						temp[wk.word] = wk;
					}
				}
				res.render('tranning_wordlist', {words:temp});
			}
		});
	} else {
		res.render('analyze');
	}
});

/* 训练模式页面 */
router.post("/to_training", function(req, res, next) {
	var word = req.body.word;
	var userId = 'system_reserved';
	res.end(JSON.stringify({word:word, userId:userId, data:TypeAndSubTypes}));
});

/* 开始训练 */
router.post("/train", function(req, res, next) {
	var userId = req.body.userId;
	var word = req.body.word;
	var type = req.body.type;
	var subType = req.body.subType;
	// UserTrainingModel
	// userId:String,
	// word:String,
	// type:String,
	// typeTimes:Number,
	// subType:String,
	// subTypeTimes:Number,
	// action:String,
	// actionTimes:Number
});

/* 文字编辑模块 */
router.get("/list", function(req, res, next) {
	var page = req.query.page;
	var pageSize = req.query.pageSize;
	var type = req.query.type;
	var subType = req.query.subType;
	var word = req.query.word;

	if(page === "" || page === undefined) {
		page = 1;
	}
	if(pageSize === "" || pageSize === undefined) {
		pageSize = 12;
	}
	var skip = parseInt(pageSize) * (parseInt(page) - 1);
	var limit = parseInt(pageSize);

	var params = {};
	if(type !== "" && type !== undefined) {
		params.type = type;
	}
	if(subType !== "" && subType !== undefined) {
		params.subType = subType;
	}
	if(word !== "" && word !== undefined) {
		params.word = word;
	}
	WordModel.find(params).limit(limit).skip(skip).sort({wordLength:-1, score:-1, subScore:-1}).exec().then(function(list) {
		WordModel.count(params, function(err, count) {
			var pageCount = Math.ceil(count / pageSize);
			var pageList = [];
			var cursor = 0;
			var currentPage = parseInt(page);
			if(currentPage >= 3 && currentPage <= pageCount - 2) {
				pageList.push({page:currentPage - 2});
				pageList.push({page:currentPage - 1});
				pageList.push({page:currentPage});
				pageList.push({page:currentPage + 1});
				pageList.push({page:currentPage + 2});
			} else if(currentPage >= 3) {
				for(cursor=parseInt(currentPage)-2;cursor<=pageCount;cursor++) {
					pageList.push({page:cursor});
				}
			} else if(currentPage <= pageCount - 2) {
				for(cursor=1;cursor<=parseInt(currentPage) + 2;cursor++) {
					pageList.push({page:cursor});
				}
			} else {
				for(cursor=1;cursor<=pageCount;cursor++) {
					pageList.push({page:cursor});
				}
			}
			for(var x in pageList) {
				if(pageList[x].page === currentPage) {
					pageList[x].isActive = true;
				}
			}
			var data = {list:list, pageCount:pageCount, currentPage:currentPage, pageList:pageList, count:count};
			if(currentPage <= 1) {
				data.prev = 1;
			} else {
				data.prev = currentPage - 1;
			}
			if(currentPage >= pageCount) {
				data.next = pageCount;
			} else {
				data.next = currentPage + 1;
			}
			data.searchType = type;
			data.searchSubType = subType;
			data.searchWord = word;
			res.render('list', data);
		});
	}).catch(function(err) {
		res.render('error');
	});
});

router.post("/save", function(req, res, next) {
	var _id = req.body._id;
	var word = req.body.word;
	var type = req.body.type;
	var score = req.body.score;
	var subType = req.body.subType;
	var subScore = req.body.subScore;
	var action = req.body.action;
	var actionScore = req.body.actionScore;
	if(!!_id && _id !== '') {
		WordModel.findByIdAndUpdate(_id, {$set:{word:word, wordLength:word.length, type:type, score:score, subType:subType, subScore:subScore, action:action,actionScore:actionScore}}, function(err, update) {
			if(err) {
				res.send("err");
			} else {
				res.send("ok");
			}
		});
	} else {
		var model = new WordModel({
			word:word,
			wordLength:word.length,
			type:type,
			score:score,
			subType:subType,
			subScore:subScore,
			action:action,
			actionScore:actionScore
		});
		model.save(function(err, save) {
			if(err) {
				res.send("err");
			} else {
				res.send("ok");
			}
		});
	}
});

router.post("/remove", function(req,res, next) {
	var id = req.body.id;
	WordModel.remove({_id:new Object(id)}, function(err, info) {
		if(err) {
			res.send("err");
		} else {
			res.send("ok");
		}
	});
});

router.post("/getSubTypes", function(req, res, next) {
	var type = req.body.type;
	var subTypes = TypeAndSubTypes[type];
	var result = [];
	for(var key in subTypes) {
		result.push(key);
	}
	res.send(result);
});

router.post("/getActions", function(req, res, next) {
	var type = req.body.type;
	var subType = req.body.subType;
	var subTypes = TypeAndSubTypes[type];
	var result = subTypes[subType];
	res.send(result);
});

router.post("/editWord", function(req, res, next) {
	var _id = req.body._id;
	WordModel.findById(_id, function(err, word) {
		if(err) {
			console.log(err);
			res.send(err);
		} else {
			res.send(word);
		}
	});
});

module.exports = router;
