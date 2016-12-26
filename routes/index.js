var express = require('express');
var core = require('../domain/core');

/* 数据库 */
var WordModel = require("../mongodb/models/WordModel");
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
	console.log("params:" + params);
	WordModel.find(params).limit(limit).skip(skip).sort({wordLength:-1, score:-1, subScore:-1}).exec().then(function(list) {
		console.log("params:" + params);
		WordModel.count(params, function(err, count) {
			console.log("count:" + count);
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
