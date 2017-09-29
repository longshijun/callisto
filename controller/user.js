var User = require('../model/user');
var Device = require('../model/device');
var wxDevice = require('../model/wxDevice');
var record = require('../model/record');
var _ = require('lodash');

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
        user.save(function(err){
            if(err)
                return callback(err);
            User.find({}, function(err,  users ){
                if(err)
                    return callback(err);
                if(users[0].openid == openid)
                    user.isOwner = true;
                else
                    user.isOwner = false;
                user.save(function(err){
                    return callback(null, user);
                })
            })

        })
    })

}

var getByOpenid = function(openid, callback){
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

var removeUser = function(openid, device_id,  callback){
    getByOpenid(openid, function(err, user){
        if(err)
            return callback(err);
        if(!user)
            return callback( {
                errorCode:1001,
                errMsg:'用户尚未注册'
            });

        unbindDevice({
            openid: openid,
            device_id: device_id
        }, function(err, result){
            console.log('解绑用户:', err);
            User.remove({
                openid: openid
            },function(err,result){
                if(err)
                    return callback(err);
                return callback(null, result);
            });
        })

    })
}

var bindDevice = function(param, callback){
    Device.findOne({
        mac: param.mac
    }, function(err, dev){
        if(err)
            return callback(err);
        if(!dev)
            return callback({
                errorCode:1002,
                errMsg:'未知设备'
            });

        getDeviceByOpenId(param.openid, function(err, device){
            if(err)
                return callback(err);

            if(device){
                return callback({
                    errorCode:12022,
                    errMsg:'您已经绑定了设备，无法再绑定其他设备'
                })
            }

            wxDevice.findOne({device_id: param.device_id}, function(err, device){
                if(err)
                    return callback(err);
                getByOpenid(param.openid, function(err, user){
                    if(err)
                        return callback(err);
                    if(!device){
                        device = new wxDevice({
                            users:[user._id],
                            device_id: param.device_id,
                            mac: param.mac,
                            deviceType: param.deviceType,
                            prototype_id: param.prototype_id
                        });
                    }else{
                        device.users.push(user._id);
                    }

                    device.save(function(err, device){
                        if(err)
                            return callback(err);
                        user.device = device._id;
                        user.save(function(err, user){
                            User.findOne({openid: param.openid})
                                .populate('device')
                                .exec(function(err,  user){
                                    return callback(null, user);
                                })

                        });
                    });
                })
            })
        })


    })
}


var unbindDevice = function(param, callback){
    var openid = param.openid;
    var device_id = param.device_id;
    //管理员才有的权限
    getDeviceByOpenId(param.openid, function(err, device){
        if(err)
            return callback(err);
        if(device && device.device_id == device_id){ //获得了用户绑定的那个设备
            getByOpenid(param.openid, function(err, user){
                if(err)
                    return callback(err);

                if(!user.isOwner &&  JSON.stringify(param.openid) !== JSON.stringify(user.openid))//非owner 解绑user
                    return callback( {
                        errorCode:1003,
                        errMsg:'无权限操作'
                    });

                else if(JSON.stringify(openid) == JSON.stringify(param.openid)){
                    getUsersByDeviceId(param.device_id,  param.openid, function(err, device){
                        if(err)
                            return callback(err);

                        var index = _.findIndex(device.users, function(chr) {
                            console.log('------------', user._id , chr._id);
                            var str1 = JSON.stringify(user._id);
                            var str2 = JSON.stringify(chr._id);
                            console.log(str1 === str2)
                            return str1 == str2;
                        });


                        if(index > -1){ // 找到wxDevice 表对应users的列表
                            device.users.splice(index, 1);
                            var saveDevice = function(){
                                device.save(function(err, device){
                                    if(err)
                                        return callback(err);
                                    if(device.users.length == 0)
                                        device.remove({device_id: device_id});

                                    user.save(function(err, user){
                                        User.update({openid: openid}, {
                                            $unset:{ device:''},
                                            $set:{isOwner: false}}, function(err){
                                            if(err)
                                                return callback(err);
                                            getByOpenid(openid, function(err, user){
                                                if(err)
                                                    return callback(err);

                                                return callback(null, user);
                                            })
                                        })
                                    })

                                })
                            }
                            if(user.isOwner && device.users.length > 0 ){
                                device.users[0].isOwner = true; // 第二个为owner
                                console.log('------- device--------->', device);
                                User.update({
                                    openid: device.users[0].openid,
                                }, {$set: {isOwner: true}}, function(){
                                    if(err)
                                        return callback(err);
                                    saveDevice();
                                });
                            }else{
                                saveDevice();
                            }


                        }else
                            return callback(null, user);

                    });
                }


            })
        }else
            return callback({
                errorCode: 2002,
                errMsg:'用户暂无绑定任何设备'
            });


    })
}

// 根据id查找用户绑定的设备
var getDeviceByOpenId = function(openid, callback){
    getByOpenid(openid, function(err, user){
        if(err)
            return callback(err);
        if(user.device){
            User.findOne({openid: openid})
                .populate('device')
                .exec(function(err,  user){
                    return callback(null, user.device);
                })
        }else
            return callback(null, null); //用户暂无绑定任何设备
    })

}

var canOPerate = function(openid, callback){
    getByOpenid(openid, function(err, user){
        if(err) return callback(err);

        if(user.isOwner)
            return callback(null, true);
        else
            return callback(null, false);
    });
}

var getUsersByDeviceId = function(device_id, openid, callback){
    Device.findOne({
        mac: device_id
    }, function(err, device){
        if(err)
            return callback(err);
        if(!device)
            return callback({
                errorCode:1002,
                errMsg:'未知设备'
            });
        getDeviceByOpenId(openid, function(err, device){
            if(err)
                return callback(err);
            if(!device || device.device_id != device_id)
                return callback({
                    errorCode: 20003,
                    errMsg:'您还未绑定设备'
                });

            wxDevice.findOne({
                device_id: device_id
            }).populate('users').exec(function(err, result){
                return callback(null, result);
            })
        });

    })
}
/*
getDeviceByOpenId('longman', function(err, device){
    if(err)
        return console.log(err);
    if(device)
        console.log('用户已经绑定了设备.');
    else
        console.log('用户暂无绑定设备');
});
*/

/*
    finger = {
        name:'大拇指',
        code:10
    }
 */
var addFinger = function(openid, device_id, finger, callback){
    getDeviceByOpenId(openid, function(err, device){
        if(err)
            return callback(err);
        if(!device || device.device_id != device_id)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });
        User.findOne({
            openid: openid
        }, function(err, user){
            if(err)
                return callback(err);
            var index = _.findIndex(user.fingers, function(chr) {
                return chr.code == finger.code;
            });

            if(index < 0){
                user.fingers.push(finger);
                user.save(function(err, user){
                    if(err)
                        return callback(err);
                    return callback(null, user);
                })
            }else
                return callback({
                    errorCode: 30001,
                    errMsg:'该指纹已存在，请勿重复添加'
                }, user);
        });
    });
}


var removeFinger = function(openid, device_id, callback){
    getDeviceByOpenId(openid, function(err, device){
        if(err)
            return callback(err);
        if(!device || device.device_id != device_id)
            return callback({
                errorCode: 20003,
                errMsg:'您还未绑定设备'
            });
        User.findOne({
            openid: openid
        }, function(err, user){
            if(err)
                return callback(err);
            var index = _.findIndex(user.fingers, function(chr) {
                return chr.code == finger.code;
            });

            if(index  > -1){
                user.fingers.splice(index, 1);
                user.save(function(err, user){
                    if(err)
                        return callback(err);
                    return callback(null, user.fingers);
                })
            }else
                return callback({
                    errorCode: 30001,
                    errMsg:'该指纹不存在'
                }, user.fingers);
        });
    });
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

/*createUser('longman', function(err, user){
    if(err)
        return console.log(err);
    if(user){
        bindDevice({
            openid:'longman',
            mac:'1234567890',
            prototype_id:'1234567890',
            deviceType:'fuckman',
            device_id:'1234567890',
            qrcode:'fuckman'
        }, function(err, result){
            console.log('绑定设备>', err, result);
        })
    }
});*/


/*
updateDeviceStatus('1234567890', {
    temp:12,
    moisture:50
}, function(err, result){
    console.log('更新设备状态---->', err, result);
});
*/

/*getDeviceStatus('1234567890', function(err, result){
    console.log('获得了设备状态----->', err, result);
});*/
/*getUsersByDeviceId('1234567890', 'longman', function(err, users){
    if(err)
        return console.log(err);
    console.log('绑定的用户列表》', users);
});*/
/*unbindDevice({
    openid:'longman',
    device_id:'1234567890'
}, function(err, result){
    if(err)
        return console.log('----出错了---', err);
    console.log('解绑成功', result);
});*/
/*bindDevice({
    openid:'fuckman',
    mac:'1234567890',
    prototype_id:'1234567890',
    deviceType:'fuckman',
    device_id:'1234567890',
    qrcode:'fuckman'
}, function(err, result){
    console.log('绑定设备>', err, result);
})*/
/*removeUser('shitman','1234567890', function(err, result){
    if(err)
        return console.log(err);
    console.log('删除用户成功');
});*/


/*canOPerate('fuckman', function(err, isAuthorized){
    if(err)
        return console.log(err);
    console.log('用户权限:', isAuthorized);
});*/

addFinger('longman', '1234567890', 50,  function(err, result){
    console.log('添加指纹了---->', err, result);
} );

module.exports = {
    createUser:createUser,
    getByOpenid:getByOpenid,
    removeUser:removeUser,
    canOPerate:canOPerate
}

//getByOpenid(1234423);