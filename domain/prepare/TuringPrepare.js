/**
 * 数据准备
 */
var Code = require("../const/Code");
var http = require("http");
var ResponseUtil = require("../util/ResponseUtil");
var DateUtil = require("../util/DateUtil");
var debug = require('debug')('express:brain-prepare-TulingPrepare');
var async = require("async");
var request = require('request');

/* 数据库 */
var HomeModel = require("../../mongodb/models/HomeModel");

var TuringPrepare = module.exports;

// TODO 后续准备缓存化，同时考虑缓存数据的更新
TuringPrepare.prepare = function(info, ret_callback, cb) {
	debug("图灵数据流程:" + "____" + DateUtil.now());
	var sentence = info.sentence;
	var url = "http://www.tuling123.com/openapi/api";
	var param = {
		"key":"ea8f05100544eb9eeb568f34d072a115",
		"info":sentence,
		"loc":'浙江省嘉兴市',
		userid:info.user.mobile
	};

	request.post(url, {form: param}, function(err, response, body) {
		if(err) {
			debug(err);
			cb(null, info, ret_callback);
		} else {
			debug("图灵返回:" + body);
			var data = {};
			data.delayOrder = false;
			data.inputstr = info.sentence;
			data.inputstr_id = info.inputstr_id;
			data.iscanlearn = true;
			data.msg = body;
			data.status = 'turing';
			debug("实际返回:" + JSON.stringify(data));
			ret_callback(ResponseUtil.resp(Code.OK, data));
		}
	});
};
