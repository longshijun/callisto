var User = require('../model/userMany');
var Device = require('../model/device');
var wxDevice = require('../model/wxDevice');
var Record = require('../model/record');
var _ = require('lodash');
var async  = require('async');
var moment = require('moment');
var createUser = function(openid, callback){
    User.findOne({ 'openid':  openid },  function (err, user) {
        if(err)
            return callback(err);
        if(user){
            return callback(null, user)
        }
        var user = new User({
            openid:openid,
        });
        user.save(function(err, user){
            if(err)
                return callback(err);
            return callback(null, user);
        })
    })
}


//// 根据id查找用户绑定的设备
var getUserByOpenid = function(openid, callback){
    User.findOne({ 'openid':  openid },  function (err, user) {
        if(err)
            return callback(err);
        if(!user)
            return callback( {
                errorCode:1001,
                errMsg:'用户尚未注册'
            })
        return callback(null, user);
    })
}
/*
 param:
 openid:
 device_id
 */
var getDeviceByDeviceId = function(param, callback   ){
    console.log('--查询-->', param)
    wxDevice.findOne({
        device_id: param.device_id
    }, function(err, device){
        if(err)
            return callback(err);
        console.log('--查询设备结果i哦-->', err, device)
        return callback(null, device );
    })
}

var bindDevice = function(param, callback){
    getUserByOpenid(param.openid, function(err, user){
        if(err)
            return callback(err);

        var hasDev = user.device.indexOf(param.device_id); //device []

        if(hasDev > -1)
            return callback({
                errorCode:20001,
                errMsg:'设备已被该用户绑定！'
            });
        wxDevice.findOne({device_id: param.device_id}, function(err, device){
            if(err)
                return callback(err);
            if(!device){
                var device = new wxDevice({
                    device_id: param.device_id,
                    users: [param.openid],
                    nickname: param.device_id
                });

                device.save(function(err, device){
                    if(err)
                        return callback(err);
                    user.device.push(param.device_id);
                    user.save(function(err, user){
                        if(err)
                            return callback(err);
                        console.log('--->user', user);
                        return callback(null, {
                            errorCode: 0,
                            errrMsg:'ok'
                        })
                    });
                })
            }else{
                /*var hasUser = device.users.indexOf(param.openid);
                if(hasUser > -1)
                    return callback({
                        errorCode:20001,
                        errMsg:'设备已被该用户绑定！'
                    });

                user.device.push(param.device_id);
                user.save(function(err, user){
                    if(err)
                        return callback(err);
                    device.users.push(param.openid);
                    device.save(function(err, device){
                        if(err)
                            return callback(err);
                        return callback(null, {
                            errorCode:0,
                            errMsg:'ok'
                        })
                    })
                })*/
                if(device.users && device.users.length > 0)
                    return callback({
                        errorCode:20001,
                        errMsg:'设备已被该用户绑定, 无法继续绑定其他设备！'
                    });
            }
        })
    })
}

var unbindDevice = function(param, callback){
    getUserByOpenid(param.openid, function(err, user){
        if(err)
            return callback(err);
        var hasDev = user.device.indexOf(param.device_id);
        if(hasDev > -1)
            user.device.splice(hasDev, 1);
        user.save(function(err, user){
            if(err) return callback(err);

            wxDevice.findOne({
                device_id: param.device_id
            }, function(err, device){
                if(err)
                    return callback(err);
                var hasUser = device.users.indexOf(param.openid);
                if(hasUser > -1){
                    device.users.splice(hasUser, 1);
                    if(device.users.length == 0){
                        device.remove({
                            device_id: param.device_id
                        }, function(err){
                            if(err)
                                return callback(err);
                            return callback(null);
                        })
                    }else{
                        device.save(function(err, device){
                            if(err)
                                return callback(err);
                            return callback(null, {
                                errorCode:0,
                                errMsg:'ok'
                            })
                        })
                    }
                }else
                    return callback(null, {
                        errorCode:0,
                        errMsg:'ok'
                    })


            })

        })

    })
}

var removeUser = function(openid,   callback){
    getUserByOpenid(openid, function(err, user){
        if(err)
            return callback(err);
        if(!user)
            return callback( {
                errorCode:1001,
                errMsg:'用户尚未注册'
            });

        var device = user.device;
        async.eachSeries(device, function(device_id, callback) {
            wxDevice.findOne({
                device_id: device_id
            }, function(err, device){
                if(err)
                    return callback(err);

                if(!device  || !device.users)
                    return callback(null)

                var index = device.users.indexOf(openid);
                if(index > -1){
                    device.users.splice(index, 1);
                    if(device.users.length == 0){
                        device.remove(function(err){
                            if(err)
                                return callback(err);
                            callback(null);
                        })
                    }else{
                        device.save(function(err, device){
                            if(err)
                                return callback(err);
                            callback(null);
                        })
                    }
                }else
                    callback(null);
            })
        }, function(err){
            User.remove({
                openid: openid
            }, function(err,result){
                if(err)
                    return callback(err);
                return callback(null, {
                    errorCode: 0,
                    errMsg:'ok'
                });
            });
        });

    })
}

var updateDeviceStatus  = function(device_id,  status, callback){
    wxDevice.findOne({
        device_id: device_id
    }, function(err, device){
        if(err)
            return callback(err);

        if(!device)
            return callback({
                errorCode: 3012,
                errmsg:'用户没有绑定该设备'
            });

        var temp = [];
        var time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        status.time = time;
        console.log('得到了设备状态--->', device);

        device.status.push(status);
        device.save(function(err){
            if(err)
                return callback(err)
            return callback(null);
        })
    })
};

var getDeviceStatus = function(device_id, callback){
    wxDevice.findOne({
        device_id: device_id
    }, function(err, device){
        if(err)
            return callback(err);
        return callback(device.status);
    });
}

/*
*   device_id
*
*   openid
* */

var canOperate = function(param, callback){
    wxDevice.findOne({
        device_id: param.device_id
    }, function(err, device){
        if(err)
            return callback(err);
        var users = device.users;
        if(users.length > 0){
            if(param.openid != users[0]) // user
                return callback(null,  false)
            else
                return callback(null,  true);
        }
    })
}

/*
    device_id
    id
 */
var addFinger = function( param,  callback){
    wxDevice.findOne({
        device_id: param.device_id
    }, function(err, device){
        if(err)
            return callback(err);

        if(!device ||  device.users.length == 0)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        var index = _.findIndex(device.fingers, function(chr) {
            return chr.id == param.id;
        });
        if(index < 0){
            device.fingers.push({
                id: param.id,
                name: '',
            });
            device.save(function(err, device){
                if(err)
                    return callback(err);
                return callback(null, {
                    errorCode: 0,
                    errMsg:'ok'
                });
            })
        }else
            return callback({
                errorCode: 30001,
                errMsg:'该指纹已存在，请勿重复添加'
            });

    })
}

var removeFinger = function(param, callback){
    wxDevice.findOne({
        device_id: param.device_id
    }, function(err, device){
        if(err)
            return callback(err);

        if(!device ||  device.users.length == 0)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        var index = _.findIndex(device.fingers, function(chr) {
            return chr.id == param.id;
        });

        if(index  > -1){
            device.fingers.splice(index, 1);
            device.save(function(err, device){
                if(err)
                    return callback(err);
                return callback(null, {
                    errorCode:0,
                    errMsg:'ok'
                });
            })
        }else
            return callback({
                errorCode: 30001,
                errMsg:'该指纹不存在'
            });
    });
}

// 报警和开门记录操作

var setDoorRecord = function(device_id, param, callback){
    wxDevice.findOne({
        device_id: device_id
    }, function(err, device){
        if(err)
            return callback(err);
        if(!device  || !device.users.length)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        var warning = {};
        if(param.fingerId != undefined){
            var state = param.state || 'closed';
            var fingerId = param.fingerId;
            warning = {
                device_id: device_id,
                door: {
                    state: state, //开门记录
                    fingerId: fingerId
                },
                time:  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            }
        }else{
            var alert = param.alert || 'closed';
            waning = {
                device_id: device_id,
                time:  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                alert: alert
            }
        }
        var record = new Record(waning);
        record.save(function(err, record){
            if(err)
                return callback(err);
            return  callback(null);
        })

    });
}

var getAllRecord = function(device_id, callback){
    wxDevice.findOne({
        device_id: device_id
    }), function(err, device){
        if(err)
            return callback(err);

        if(!device  || !device.users.length)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

            Record.find({
                device_id: device_id
            }, function(err, result){
                if(err)
                    return callback(err);
                return callback(null, result);
            })
    };
}

// start_time : 2017-10-20 10:00:00

var getRecordByTime = function(device_id, start_time, end_time, callback){

    wxDevice.findOne({
        device_id: device_id
    }), function(err, device){
        if(err)
            return callback(err);

        if(!device  || !device.users.length)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });
        Record.find({
            device_id: device_id,
            time: {
                "$lt": start_time,
                "$gte": end_time
            }
        }, function(err, result){
            if(err)
                return callback(err);
            return callback(null, result);
        })
    };
}


/*

removeUser('longman', function(err, result){
    console.log('取消关注', err, result);
})

*/



/*
bindDevice({
    device_id: '1234567890',
    openid: 'longman'
}, function(err, result){
    console.log('数据库绑定设备', err, result);
});
*/

/*getUsersByDeviceId({
    device_id: '0987654321',
}, function(err, device){
    console.log('查询设备--->', err, device);
})*/

/*createUser('longman', function(err, user){
    if(err)
        return console.log(err);

    console.log('创建用户OK');
});*/


/*addFinger('longman', '1234567890', 50,  function(err, result){
 console.log('添加指纹了---->', err, result);
 } );*/


/*addFinger('longman', '1234567890', 50,  function(err, result){
 console.log('添加指纹了---->', err, result);
 } );*/
/*removeFinger({
    openid:'longman',
    code:50,
    device_id:'1234567890'
}, function(err, result){
    console.log('删除指纹:', err, result);
});*/
/*
setDoorRecord('845dd74a6c4b', {
    state: 'open',
    fingerId: 15
}, function(err, result){
    console.log('智能柜开门操作--->', err, result);
})*/
module.exports.api = {
    createUser:createUser,
    getUserByOpenid:getUserByOpenid,
    bindDevice: bindDevice,
    unbindDevice: unbindDevice,
    removeUser:removeUser,
    getDeviceByDeviceId: getDeviceByDeviceId,
    updateDeviceStatus:updateDeviceStatus,
    getDeviceStatus:getDeviceStatus,
    addFinger: addFinger,
    removeFinger: removeFinger,
    getRecordByTime: getRecordByTime,
    setDoorRecord:setDoorRecord
}

//getUserByOpenid(1234423);