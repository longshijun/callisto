var wechat = require('../controller/wechat');
var user = require('../controller/user');
module.exports = {
    handBind: function(access_token, device_id, openid, callback){
        var self = this;
        // 强行微信绑定设备
        user.api.bindDevice({
            openid: openid,
            device_id: device_id,
            mac: device_id.toUpperCase(),
        }, function(err, device){
            console.log('数据库绑定---->', err, device);
            if(err)
                return callback(err);
            wechat.api.bindOperation({
                device_id: device_id,
                openid: openid
            }, 'compel_bind', access_token, function(err, result){
                console.log('微信绑定---》', err, result);
                if(err){
                    user.api.unbindDevice({
                        openid: openid,
                        device_id: device_id,
                        mac: device_id.toUpperCase(),
                    }, function(err){
                        if(err)
                            return callback(err);
                        return callback(null, result.base_resp);
                    })
                }

            });
        })
    },
    handleUnbind: function(access_token, openid,  callback){
        user.api.getDeviceByOpenid(openid, function(err, device){
            if(err)
                return callback(err);
            wechat.api.bindOperation({
                device_id: device.device_id,
                openid: openid
            }, 'compel_unbind', access_token,  function(err, result){
                console.log('微信解绑--》', err, result);
                user.api.unbindDevice({
                    openid: openid,
                    device_id:  device.device_id
                }, function(err, result){
                    if(err)
                        return callback(err);
                    console.log('数据库解绑-->', err, result);
                    return callback(null, result.base_resp);
                });
            });
        })


    }
}