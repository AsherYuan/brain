/**
 * 是否是全面执行的
 */
var debug = require('debug')('express:brain-util-AllChecker');

var AllChecker = module.exports;

var flagWords = ["全部", '全', ''];

/* 后续要考虑这里设备状态如果多个，并且是不同品牌的问题, 但是在同一个语句中同时出现时，怎么合并状态的问题 */
AllChecker.check = function(info) {
	var isAll;
	/* 范围分成4个阶段，用户，家庭，楼层，房间 */
	var scope;

	var sentence = info.sentence;
	var homes = info.homes;
	var layers = info.layers;
	var grids = info.homeGrids;

	var i,j,k;

	var isHome = false;
	var isLayer = false;
	var isGrid = false;

	/* 循环查看家庭里是否有符合 */
	for(i=0;i<homes.length;i++) {
		var home = homes[i];

	}


	var param = {
		isAll:isAll,
		scope:score
	}
	return param;
};