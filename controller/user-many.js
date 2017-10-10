var User = require('../model/userMany');
var Device = require('../model/device');
var wxDevice = require('../model/wxDevice');
var record = require('../model/record');
var _ = require('lodash');
var async  = require('async');
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
var getUsersByDeviceId = function(param, callback   ){
    wxDevice.findOne({
        device_id: param.device_id
    }, function(err, device){
        if(err)
            return callback(err);
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
            console.log('============', device)

            if(!device){
                var device = new wxDevice({
                    device_id: param.device_id,
                    users: [param.openid]
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
                var hasUser = device.users.indexOf(param.openid);
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
                })
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
                console.log('----------->', hasUser);
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
    }).populate('users').exec(function(err, device){
        if(err)
            return callback(err);
        device.status = status;
        device.save(callback);
    });
};

var getDeviceStatus = function(device_id, callback){
    wxDevice.findOne({
        device_id: device_id
    }).populate('users').exec(function(err, device){
        if(err)
            return callback(err);
        return callback(null, device.status);
    })
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

var addFinger = function( param,  callback){
    getUserByOpenid(param.openid, function(err, user){
        if(err)
            return callback(err);
        if(!user.device || user.length == 0)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        if(user.device.indexOf(param.device_id) == -1)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        wxDevice.findOne({
            device_id: param.device_id
        }, function(err, device){
            if(err)
                return callback(err);
            var index = _.findIndex(device.fingers, function(chr) {
                return chr.code == param.code;
            });
            if(index < 0){
                device.fingers.push({
                    code: param.code,
                    openid: param.openid
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

    });
}

var removeFinger = function(param, callback){
    getUserByOpenid(param.openid, function(err, user){
        if(err)
            return callback(err);
        if(!user.device || user.length == 0)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });

        if(user.device.indexOf(param.device_id) == -1)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });



        wxDevice.findOne({
            device_id: param.device_id
        }, function(err, device){
            if(err)
                return callback(err);
            var index = _.findIndex(device.fingers, function(chr) {
                return chr.code == param.code;
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
    });
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
removeFinger({
    openid:'longman',
    code:50,
    device_id:'1234567890'
}, function(err, result){
    console.log('删除指纹:', err, result);
});
module.exports.api = {
    createUser:createUser,
    getUserByOpenid:getUserByOpenid,
    removeUser:removeUser,
    updateDeviceStatus:updateDeviceStatus,
    getDeviceStatus:getDeviceStatus
}

//getUserByOpenid(1234423);