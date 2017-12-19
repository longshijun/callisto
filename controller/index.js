var OAuth = require('wechat-oauth');
var url = require('url');
var config = require('../config');
var user = require('./user-many');
var wechat = require('./wechat');
var callisto = require('../wechat/callisto');
var evHandler = require('../wechat/evHandler');
var _ = require('lodash');
var deviceTrans = require('./device');
module.exports = {
    silentAuthorization: function(req, config,  cb){
        var oauth = new OAuth(config.wx.appid, config.wx.secret);
        code = url.parse(req.url, true).query.code;
        console.log('网页静默授权:', req.url);
        if(!code) {
            code = url.parse(req.url, true).query.code;
            console.error('Cannot do silent authorization, code undefined');
            if(!code){
                if(!req.session.openid)
                    return cb('Invalid code');
                else
                    return cb(null, req.session.openid);
            }
        }
        oauth.getAccessToken(code, function (err, result) {
            if(err){
                cb(err);
            }
            else {
                console.log(result.data);
                cb(null, result.data.openid);
            }
        });
    },

    getDeviceList: function(req, res){
        var openid = req.body.openid;
        if(!openid)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });

        user.api.getUserByOpenid(openid, function(err, user){
            if(err)
                return res.send(err);
            res.send({
                errorCode: 0,
                result:user.device
            });
        })

    },

    getUserList: function(req, res){
        var device_id = req.body.device_id;
        if( !device_id)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });
        user.api.getDeviceByDeviceId({device_id: device_id}, function(err, device){
            if(err)
                return res.send(err);
            console.log('获得用户列表--->', device);


            if(device && device.users.length){
                wechat.common.batchGetUsers.call(callisto, device.users || [], function(err, result){
                    if(err)
                        return res.send(err);
                    var r = {
                        errorCode: err || 0,
                        result: result
                    }
                    return res.send(r);
                })
            }else{
                var r = {
                    errorCode: err || 0,
                    result: []
                }
                return res.send(r);
            }

        })

    },
    getDeviceInfo: function(req, res){
        var openid = req.body.openid;
        if(!openid)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });

        user.api.getDeviceByOpenid(openid, function(err, device){
            if(err)
                return res.send(err);
            var r = {
                device: device,
                errorCode: err || 0
            }
            return res.send(r);

        })

    },

    addFinger: function(req, res){
        var openid = req.body.openid;
        var device_id = req.body.device_id;
        if(!openid || !device_id)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });

        user.api.getDeviceByDeviceId({
            device_id: device_id
        }, function(err, device){
            if(err)
                return res.send(err);
            if(!device || device.users.length == 0)
                return callback({
                    errorCode: 3012,
                    errmsg:'用户没有绑定该设备'
                });
            var fingers = [];
            if(device.fingers.length > 99)
                return callback({
                    errorCode: 4012,
                    errmsg:'用户指纹数量已超过上线'
                });
            for(var index in device.fingers){
                fingers.push(device.fingers[index].id);
            }
            deviceTrans.sendToDevice({
                "messageCode": 68,
                "cmd": 'addFinger',
                "value": device.getFinger(fingers),
                "mac": '845DD74D4D9A',
                "deviceId":43
            }, function(err, result){
                if(err)
                    return res.send(err);
                console.log('添加指纹请求发送成功');
                return res.send(result);
            })

        })
    },

    removeFinger: function(req, res){
        var device_id = req.body.device_id;
        var fingerId = req.body.fingerId;
        if( !device_id || fingerId == undefined)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });

        user.api.getDeviceByDeviceId({
            device_id: device_id
        }, function(err, device){
            if(err)
                return res.send(err);
            if(!device || device.users.length == 0)
                return callback({
                    errorCode: 3012,
                    errmsg:'用户没有绑定该设备'
                });

            var index = _.findIndex(device.fingers, function(chr) {
                return chr.id == fingerId;
            });
            if(index == -1)
                return callback({
                    errorCode: 3052,
                    errmsg:'无效指纹'
                });
            deviceTrans.sendToDevice({
                "messageCode": 68,
                "cmd": 'removeFinger',
                "value": fingerId,
                "mac": '845DD74D4D9A',
                "deviceId":43
            }, function(err, result){
                if(err)
                    return res.send(err);
                return res.send(result);
            });
        })

    },

    unbind: function(req, res){
        var openid = req.body.openid;
        var device_id = req.body.device_id;
        if(!openid || !device_id)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });
        evHandler.handleUnbind(callisto.wechatInfo.access_token,  {
            openid: openid,
            device_id: device_id
        }, function(err, result){
            if(err)
                return res.reply(err);
            var r = {
                errorCode: err || 0
            }
            return res.send(r);
        });
    },
    renderDeviceList: function(req, res){
        console.log('------->', req.url);
        res.render('user');
    }

}