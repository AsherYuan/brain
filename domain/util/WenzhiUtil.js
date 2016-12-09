// var http = require('http');
var https = require('https');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var crypto = require('crypto');
var qs = require("querystring");
var urlencode = require('urlencode');
var CryptoJS = require('crypto-js');

var debug = require('debug')('express:brain-util-WenzhiUtil');

var WenzhiUtil = module.exports;

var signature = function(param, SecretKey) {
	var url = "";
	for(var key in param) {
		if(url === "") {
			url += key + "=" + param[key];
		} else {
			url += "&" + key + "=" + param[key];
		}
	}
	var signatureSource = "GETwenzhi.api.qcloud.com/v2/index.php?" + url;
	signatureSource = iconv.encode(signatureSource,'utf-8');
	var sign = crypto.createHmac('sha1', SecretKey).update(signatureSource).digest().toString('base64');
	return sign;
};

var reorganize = function(sentence, cb) {
	var target = JSON.parse(sentence);
	if(!!target) {
		if(target.codeDesc === "Success") {
			var tokens = target.tokens;
			debug(JSON.stringify(tokens));
			// TODO 后续可能考虑组合词的问题
			var combtokens = target.combtokens;

			if(!!tokens) {
				var after = [];
				var newSentence = "";
				for(var t_index in tokens) {
					var token = tokens[t_index];
					/* 过滤掉标点符号和语气词 */
					if(!(token.wtype === '标点符号' || token.wtype === '语气词' || token.wtype === '助词')) {
						after.push(token);
					}
				}

				/* 如果出现数词和量词，合并两者 */
				var temp = []
				for(var t=0;t<after.length;t++) {
					if(t<after.length - 1) {
						if(after[t].wtype === '数词' && after[t + 1].wtype === '量词') {
							var t_word = after[t];
							t_word.wtype = '数量词';
							t_word.word = t_word.word + after[t + 1].word;
							temp.push(t_word);
							t = t + 1;
						} else {
							temp.push(after[t]);
						}
					} else {
						temp.push(after[t]);
					}
				}
				after = temp;

				for(t=0;t<after.length;t++) {
					newSentence += after[t].word;
				}

				cb(null, newSentence, after);
			} else {
				cb("no tokens");
			}
		} else {
			cb("request error");
		}
	} else {
		cb("request error");
	}
};

WenzhiUtil.separate = function (sentence, cb) {
	var url = "https://wenzhi.api.qcloud.com/v2/index.php";
	/* 公共参数 */
	var Action = "LexicalAnalysis";
	var Region = "sh";
	var Timestamp = parseInt(new Date().getTime() / 1000);
	var Nonce = Math.round(Math.random() * 100000);
	var SecretId = "AKIDVDEn1pA7ms9TVMc6hVPK0mJyAvSjB5wC";
	var SecretKey = "iNBBt2ogJR82yxrYNrW2w9HvBwf8j4gv";

	/* 接口参数 */
	var text = sentence;
	var code = 2097152;
	// var type = 0; // 分得更细
	var type = 1; // 保留更多短语

	var param = {
		Action:Action,
		Nonce:Nonce,
		Region:Region,
		SecretId:SecretId,
		Timestamp:Timestamp,
		code:code,
		text:text,
		type:type
	};
	/* 加密 */
	var Signature = signature(param, SecretKey);
	param.Signature = Signature;

	param.Action = urlencode(Action, "UTF-8");
	param.Nonce = urlencode(Nonce, "UTF-8");
	param.Region = urlencode(Region, "UTF-8");
	param.SecretId = urlencode(SecretId, "UTF-8");
	param.Timestamp = urlencode(Timestamp, "UTF-8");
	param.code = urlencode(code, "UTF-8");
	param.text = urlencode(text, "UTF-8");
	param.type = urlencode(type, "UTF-8");
	param.Signature = urlencode(Signature, "UTF-8");
debug("text:" + text);
	url += "?Action=" + param.Action + "&Nonce=" + param.Nonce + "&Region=" + param.Region + "&SecretId=" + param.SecretId;
	url += "&Timestamp=" + param.Timestamp + "&Signature=" + param.Signature;
	url += "&text=" + iconv.encode(param.text,'utf-8');
	url += "&code=" + param.code + "&type=" + type;

    https.get(url, function (res) {  
        var body = ""; 
        res.on('data', function (data) {  
            body += data;
        });  
        res.on("end", function () {
        	reorganize(body, function(err, sentence, words) {
        		if(err) {
        			cb(err);
        		} else {
        			cb(null, sentence, words);
        		}
        	});
        });  
    }).on("error", function (err) {
    	console.log(JSON.stringify(err));
        cb(err);
    });
};
