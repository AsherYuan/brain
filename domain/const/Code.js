module.exports = {
    OK: {'code': 200, 'codetxt': '操作成功'},
    FAIL: {'code': 500, 'codetxt': '操作失败'},
    INVALID_PARAM: {'code':501, 'codetxt':'参数不正确'},
    DATABASE: {'code':502, 'codetxt':'数据库通信错误'},
    USER: {
        USER_NOT_EXIST: {'code': 1001, 'codetxt': '用户不存在'}
    },
    HOME: {
        HOME_NOT_EXIST: {'code': 2001, 'codetxt': '家庭不存在'},
        HOMEGRID_NOT_CREATED: {'code' : 2002, 'codetxt':'房间信息未创建'}
    },
    DEVICE: {
    	USER_HAS_NO_DEVICE: {'code': 3001, 'codetxt': '用户没有任何家用电器设备'}
    }
};
