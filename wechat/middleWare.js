var Wechat = require('wechat');
var config = require('../config');
var callisto = require('./callisto');
var user = require('../controller/user');
var fs = require('fs');

callisto.start();

var options = {
    token: config.wx.token,
    appid: config.wx.appid,
    appsecret: config.wx.secret,
    encodingAESKey : ''
}

function handleUserToDeviceEvent(req, res, next){

}



function handleUserEvent(req, res, next){
    var message = req.weixin;
    var openid = message.FromUserName;
    callisto.wechatInfo.query = req.query;
    switch(message.Event) {

        case 'VIEW':{
            console.log("收到了VIEW事件:", req.path)
            break;
        }
        case 'subscribe': {
            user.createUser(openid, function(err){
                if(err) return res.reply('你好，用户创建失败！');
             //   fs.writeFileSync('./model/data.json', JSON.stringify(callisto.wechatInfo, null, '    '));
                 res.reply('你好，欢迎关注，用户创建成功');
            })
        }
            break;

        case 'unsubscribe': {
            console.log('您取消了关注', message);
            /*user.removeUserByOpenid(openid, function(err){
                if(err) return res.reply('你好，用户创建失败！');
                console.log('删除用户成功');
                res.reply('你好，欢迎关注，用户创建成功');
            })*/
        }
            break;

        default: {
            res.reply();
        }
    }
}

function handleUserToDeviceEvent(req, res, next) {
    var evHandler = require('./evHandler');
    var self = this;
    var message = req.weixin;
    var device_id = message.DeviceID;
    switch(message.Event) {
        case 'bind': {
            evHandler.handBind.call(self, callisto.wechatInfo.access_token, message.FromUserName, device_id, function(err, result){

            });

        }
            break;

        case 'unbind': {
            evHandler.handleUnbind.call(this, res, message);
        }
            break;

        case 'subscribe_status': {
            self.wechatAPI.getLatestToken(function(err, tokenMsg) {
                evHandler.handleSubscribeStatus.call(self, res, message, tokenMsg.accessToken);
            });

        }
            break;

        case 'unsubscribe_status': {

        }
            break;
    }
}


function handleMiddleWare(req, res, next){
    console.log('收到微信的消息了:', req.weixin, req.query);
    var message = req.weixin;
    callisto.wechatInfo.message = message;
    fs.readFile('./model/data.json', function(err, wechatInfo){
        if(err)
            throw new Error(err);
        callisto.wechatInfo = typeof wechatInfo == 'string'? JSON.parse(wechatInfo):wechatInfo;
        callisto.wechatInfo.message = message;

        switch(message.MsgType) {
            case 'device_event': {
                handleUserToDeviceEvent.call(this, req, res, next);
            }
                break;

            case 'event': {
                handleUserEvent.call(this, req, res, next);
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

    });
}



module.exports.middleWare = {
    handleWechat:  Wechat(options, handleMiddleWare.bind(callisto)),
}
