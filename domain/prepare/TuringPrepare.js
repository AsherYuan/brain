/**
 * 数据准备
 */
var Code = require("../const/Code");
var http = require("http");
var ResponseUtil = require("../util/ResponseUtil");
var DateUtil = require("../util/DateUtil");
var debug = require('debug')('express:brain-prepare-TulingPrepare');
var async = require("async");

/* 数据库 */
var HomeModel = require("../../mongodb/models/HomeModel");

var TuringPrepare = module.exports;

// TODO 后续准备缓存化，同时考虑缓存数据的更新
TuringPrepare.prepare = function(info, ret_callback, cb) {
	debug("图灵数据流程:" + "____" + DateUtil.now());
	var sentence = info.sentence;
	var url = "http://www.tuling123.com/openapi/api";
	var key = "ea8f05100544eb9eeb568f34d072a115"; 
	url = url + "?key=" + key + "&info=" + sentence + "&nd=" + new Date().getTime();
	http.get(url, function (res) {  
        var body = ""; 
        res.on('data', function (data) {  
            body += data;
        });  
        res.on("end", function () {
        	debug("图灵返回:" + body);
        	var data = {};
        	data.delayOrder = false;
        	data.inputstr = info.sentence;
        	data.inputstr_id = info.inputstr_id;
        	data.iscanlearn = true;
        	data.msg = body;
        	data.status = 'turing';
        	ret_callback(ResponseUtil.resp(Code.OK, data));
        });  
    }).on("error", function (err) {
    	debug(err);
    	cb(null, info, ret_callback);
    });
};