/**
 * 是否是全面执行的
 */
var debug = require('debug')('express:brain-util-AllChecker');

var AllChecker = module.exports;

var flagWords = ['所有', "全部", '全都', '全', '都'];

/* 后续要考虑这里设备状态如果多个，并且是不同品牌的问题, 但是在同一个语句中同时出现时，怎么合并状态的问题 */
AllChecker.check = function(info) {
	var isAll;
	
	var sentence = info.sentence;
	for(var i=0;i<flagWords.length;i++) {
		if(sentence.indexOf(flagWords[i]) > -1) {
			isAll = true;
			sentence = sentence.replace(flagWords[i], "");
		}
	}
	info.sentence = sentence;
	info.isAll = isAll;
	debug("全部操作检查结果::isAll::" + isAll + "____" + info.sentence);
	return info;
};