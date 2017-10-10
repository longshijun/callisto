var Wechat = require('wechat');
var config = require('../config');
var callisto = require('./callisto');
var user = require('../controller/user');
var wechat = require('../controller/wechat');
var fs = require('fs');
var evHandler = require('./evHandler');
var url = require('url');
callisto.start();

var options = {
    token: config.wx.token,
    appid: config.wx.appid,
    appsecret: config.wx.secret,
    encodingAESKey : ''
}


function handleUserEvent(req, res, next){
    var message = req.weixin;
    var openid = message.FromUserName;
    var self = this;
    callisto.wechatInfo.query = req.query;
    switch(message.Event) {

        case 'VIEW':{
            console.log("收到了VIEW事件:", req.path);
            url.parse(message.EventKey).pathname;
            break;
        }
        case 'subscribe': {
            user.api.createUser(openid,  function(err){
                if(err) return res.reply('你好，用户创建失败！');
             //   fs.writeFileSync('./model/data.json', JSON.stringify(callisto.wechatInfo, null, '    '));


                res.reply('你好，欢迎关注，用户创建成功');
            })
        }
            break;

        case 'unsubscribe': {
            console.log('您取消了关注');

            callisto.getLastedAccessToken(function(err, access_token){
                if(err)
                    throw new Error(err);

                evHandler.handleUnbind.call(self, access_token, message.FromUserName, function(err, result){
                    if(err)
                        return res.reply(err);
                    user.api.removeUser(openid, function(err){
                        if(err) return res.reply('你好，用户创建失败！');
                        //   fs.writeFileSync('./model/data.json', JSON.stringify(callisto.wechatInfo, null, '    '));
                        res.reply();
                    })
                });

            });


        }
            break;

        default: {
            res.reply();
        }
    }
}

function handleUserToDeviceEvent(req, res, next) {

    var self = this;
    var message = req.weixin;
    var device_id = message.DeviceID;
    console.log('收到设备消息了---->', message.Event);
    switch(message.Event) {
        case 'bind': {

            callisto.getLastedAccessToken(function(err, access_token){
                if(err)
                    throw new Error(err);

                evHandler.handBind.call(self, access_token, device_id, message.FromUserName, function(err, result){
                    if(err)
                        return res.reply(err);
                });
            });
        }
            break;

        case 'unbind': {

            callisto.getLastedAccessToken(function(err, access_token){
                if(err)
                    throw new Error(err);
                console.log('获得access token成功！', access_token);

                evHandler.handleUnbind.call(self, access_token, message.FromUserName, device_id, function(err, result){
                    if(err)
                        return res.reply(err);
                });

            });


        }
            break;

        case 'subscribe_status': {

            callisto.getLastedAccessToken(function(err, access_token){
                if(err)
                    throw new Error(err);
                console.log('获得access token成功！', access_token);

                wechat.api.reportDeviceConnection(access_token,  message.FromUserName, device_id, 1, function(){
                    if(err)
                        return res.reply('无法获得设备状态');
                } );

            });

        }
            break;

        case 'unsubscribe_status': {

        }
            break;
    }
}


function handleMiddleWare(req, res, next){
    console.log('收到微信的消息了:', req.weixin);
    var message = req.weixin;
    callisto.wechatInfo.message = message;
    var self = this;
    switch(message.MsgType) {
        case 'device_event': {
            handleUserToDeviceEvent.call(self, req, res, next);
        }
            break;

        case 'event': {
            handleUserEvent.call(self, req, res, next);
        }
            break;

        case 'text':{
            var content = message.Content;
            if(content.indexOf('宝宝')){
                res.reply('你好，宝宝，我是longman！');
            }else if(content.indexOf('大叔')){
                res.reply('你好，宝宝，大叔欢迎你！');
            }

            break;
        }

        default :{
            res.reply([
                {
                    title: '你好',
                    description: '这是longman之家',
                    picurl: config.domain_name + 'images/baby.jpg',
                    url: 'http://www.baidu.com.com'
                }
            ]);
        }
    }
}



module.exports.middleWare = {
    handleWechat:  Wechat(options, handleMiddleWare.bind(callisto)),
}
