/**
 * 基础词汇生成器
 */
var Base = require("../domain/const/TypeAndSubTypes");
var WordModel = require("../mongodb/models/WordModel");

/* 准备插入的数据 */
/* 注意，每一条数据的autogen为true */
var words = [];
var i;

/* 空调基础的插入 */
var key = "空调";
var subTypesMap = Base[key];
var subKey = "模式";
var actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

subKey = "温度";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey + "度",
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

subKey = "风速";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var wordTemp = actionKey === 1 ? '自动' : actionKey === 2 ? '小风' : actionKey === 3 ? '中风' : '大风';
	var nw = new WordModel({
		word:wordTemp,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

subKey = "状态";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}


key = "电视";
subTypesMap = Base[key];
subKey = "状态";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

key = "电灯";
subTypesMap = Base[key];
subKey = "状态";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

key = "窗帘";
subTypesMap = Base[key];
subKey = "状态";
actionsArray = subTypesMap[subKey];
for(i=0;i<actionsArray.length;i++) {
	actionKey = actionsArray[i];
	var nw = new WordModel({
		word:actionKey,
		type:key,
		score:100,
		subType:subKey,
		subScore:100,
		action:actionKey,
		actionScore:100,
		autogen:true
	});
	// words.push(nw);
}

/* 存入数据库 */
for(var w in words) {
	words[w].save(function(err, ww) {
		console.log(err + "__" + ww);
	});
}


/* 非基础数据部分 */

var randomWord = [['你好','空调',100,'模式',100,'制冷',100]];
var obj = [];
obj = ['你好1','空调',100,'模式',100,'制冷',100];randomWord.push[obj];
console.log(randomWord);

var aa = [];
aa.push("111");
aa.push('222');
console.log(aa);

/**
 * 设备品牌基础数据
 */
// module.exports = {
// 	"空调":{
// 		"模式":['制冷','制热','通风','自动'],
// 		"温度":[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
// 		"风速":[1,2,3,4],
// 		"状态":["开","关"],
// 		"温度上下文":[-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
// 		"风速上下文":[-3,-2,-1,0,1,2,3]
// 	},
// 	"电视":{
// 		"按钮":['T_ONOFF', 'T_D0', 'T_D1', 'T_D2', 'T_D3', 'T_D4', 'T_D5', 'T_D6', 'T_D7', 'T_D8', 'T_D9', 'T_D0', 'T_OK', 'T_HOME', 'T_RETURN', 'T_MENU', 'T_MUTE', 'T_RIGHT', 'T_LEFT', 'T_UP', 'T_DOWN'],
// 		"音量上下文":[-100,-90,-80,-70,-60,-50,-40,-30,-20,-10,0,10,20,30,40,50,60,70,80,90,100],
// 		"频道上下文":[-1,0,+1],
// 		"状态":["开", "关"]
// 	},
// 	"电灯":{
// 		"状态":["开","关"]
// 	},
// 	"窗帘":{
// 		"状态":["开","关"]
// 	}
// };