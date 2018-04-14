var wechat = require('../controller/wechat');
var user = require('../controller/user-many');
var async  = require('async');
var deviceTrans = require('../controller/device');
module.exports = {
    handBind: function(access_token, device_id, openid, callback){
        var self = this;

        // 强行微信绑定设备
        user.api.bindDevice({
            openid: openid,
            device_id: device_id,
            mac: device_id.toUpperCase(),
        }, function(err, device){
            if(err)
                return callback(err);
            wechat.api.bindOperation({
                device_id: device_id,
                openid: openid
            }, 'compel_bind', access_token, function(err, result){
                console.log('微信绑定---》', err, result);
                result = typeof result == 'string'? JSON.parse(result) : result
                if( err || result.base_resp.errcode != 0 ){ //微信绑定错误了
                    user.api.unbindDevice({
                        openid: openid,
                        device_id: device_id,
                        mac: device_id.toUpperCase(),
                    }, function(err){
                        wechat.api.bindOperation({
                            device_id: device_id,
                            openid: openid
                        }, 'compel_unbind', access_token, function(err, result){
                            console.log('微信绑定错误，微信解绑---》', err, result);
                            return callback(err);
                        });
                    })
                }else{
                    return callback(null, result);
                }

            });
        })
    },
    handleUnbind: function(access_token, param,  callback){
        wechat.api.bindOperation({
            device_id: param.device_id,
            openid: param.openid
        }, 'compel_unbind', access_token,  function(err, result){
            console.log('微信解绑--》', err, result);

            result = typeof result == 'string'? JSON.parse(result) : result
            if(result.base_resp.errcode != 0)
                return callback(result);
            user.api.unbindDevice(param, function(err, result){
                if(err)
                    return callback(err);
                console.log('数据库解绑-->', err, result);
                user.api.removeAllRecords(param.device_id, function(){})
                return callback(null, result);
            });
        });
    },
    handleUnsubscribe: function(access_token, openid, callback){
        user.api.getUserByOpenid(openid, function(err, result){
            if(err) return callback(err);
            async.eachSeries(result.device, function(device_id, callback) {
                user.api.removeAllRecords(device_id, function(){});
                deviceTrans.sendToDevice({
                    "messageCode": 68,
                    "cmd": 'removeAllFingers',
                    "value": 0,
                    "deviceId": 43,
                    "mac": device_id
                }, function(err){});

                wechat.api.bindOperation({
                    device_id: device_id,
                    openid: openid
                }, 'compel_unbind', access_token, function(err, result){
                    console.log('微信解绑---》', err, result);

                    if(err)
                        return callback(err);
                     else
                        callback();
                });
            }, function(err){
                user.api.removeUser(openid, function(err){
                    if(err) return callback(err);
                    //   fs.writeFileSync('./model/data.json', JSON.stringify(callisto.wechatInfo, null, '    '));
                    return callback(null);
                });
            });

        })

    }
}