var OAuth = require('wechat-oauth');
var url = require('url');
var config = require('../config');
var user = require('./user');
var wechat = require('./wechat');
var callisto = require('../wechat/callisto');
var evHandler = require('../wechat/evHandler');
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

    getUserList: function(req, res){
        var openid = req.body.openid;
        if(!openid)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });
        user.api.getDeviceByOpenid(openid, function(err, device){
            if(err)
                return res.send(err);

            if(!device)
                return res.send({
                    errorCode: err || 0,
                    result: []
                })

            var device_id = device.device_id;
            user.api.getUsersByDeviceId(device_id, openid, function(err, result ){
                if(err)
                    return res.send(err);
                var users = result.users || [];
                var temp = [];
                users.forEach(function(user){
                    temp.push(user.openid);
                })
                wechat.common.batchGetUsers.call(callisto, temp, function(err, result){
                    if(err)
                        return res.send(err);
                    var r = {
                        errorCode: err || 0,
                        result: result
                    }
                    return res.send(r);
                })
            })

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
    unbind: function(req, res){
        var openid = req.body.openid;
        if(!openid)
            return res.send({
                errorCode: 40001,
                errMsg:'参数错误'
            });
        evHandler.handleUnbind(callisto.wechatInfo.access_token, openid, function(err, result){
            if(err)
                return res.reply(err);
            var r = {
                errorCode: err || 0
            }
            return res.send(r);
        });
    },

}