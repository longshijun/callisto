var Wechat = require('wechat');
var config = require('../config');
var callisto = require('./callisto');
var user = require('../controller/user-many');
var wechat = require('../controller/wechat');
var fs = require('fs');
var evHandler = require('./evHandler');
var url = require('url');
var deviceTrans = require('../controller/device');
callisto.start();
var sockets = {};


setTimeout(function(){
   // console.log('---->', callisto.controller.socketio);
    callisto.controller.socketio.of('/chat').on('connection', function (socket) {
        socket.on('client', function (data) {
            var openid = data.openid;
            console.log('data from client:', data);
            if (!sockets[openid])
                sockets[openid] = socket;
        }).on('disconnect', function () {
            delete sockets[openid];
        });
    });
})

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
            res.redirect(message.EventKey + '?openid=' + message.FromUserName)
            break;
        }
        case 'subscribe': {
            user.api.createUser(openid,  function(err){
                if(err) return res.reply('你好，用户创建失败！');
             //   fs.writeFileSync('./model/data.json', JSON.stringify(callisto.wechatInfo, null, '    '));

                console.log('用户关注---');
                res.reply('你好，欢迎关注，用户创建成功');
            })
        }
            break;

        case 'unsubscribe': {
            evHandler.handleUnsubscribe( callisto.wechatInfo.access_token, openid, function(err){
                console.log('您取消了关注');
                res.reply(err);
            } )


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

            evHandler.handBind.call(self,  callisto.wechatInfo.access_token, device_id, message.FromUserName, function(err, result){
                if(err){
                    wechat.api.bindOperation({
                        device_id: device_id,
                        openid:  message.FromUserName
                    }, 'compel_unbind', callisto.wechatInfo.access_token,  function(err, result){

                        var bindSuccessInfo = config.wx.template.bindSuccessInfo;
                        //设备绑定成功
                        var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                            + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                        var data = {
                            "first": {
                                "value": '设备绑定失败',
                                "color": "#173177"
                            },
                            "keyword1":{    //DeviceID
                                "value": device_id,
                                "color": "#173177"
                            },
                            "keyword2": {  //device name
                                "value": '智能保险柜',
                                "color": "#173177"
                            },
                            "keyword3": {
                                "value": nowtime,
                                "color": "#173177"
                            },
                            "remark":{
                                "value": '该设备已经被绑定，无法再绑定新用户，请联系管理员！',
                                "color": "#d11a19"
                            }
                        };
                        callisto.wechatAPI.sendTemplate(message.FromUserName, bindSuccessInfo, null, data, function(){
                            return res.reply('绑定设备失败！');
                        });
                    });
                }else{

                    var bindSuccessInfo = config.wx.template.bindSuccessInfo;
                    //设备绑定成功
                    var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                        + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                    var data = {
                        "first": {
                            "value": '设备绑定成功',
                            "color": "#173177"
                        },
                        "keyword1":{    //DeviceID
                            "value": device_id,
                            "color": "#173177"
                        },
                        "keyword2": {  //device name
                            "value": '智能保险柜',
                            "color": "#173177"
                        },
                        "keyword3": {
                            "value": nowtime,
                            "color": "#173177"
                        },
                        "remark":{
                            "value": '',
                            "color": "#d11a19"
                        }
                    };
                    callisto.wechatAPI.sendTemplate(message.FromUserName, bindSuccessInfo, null, data, function(){});
                    return res.reply();
                }

            });

        }
            break;

        case 'unbind': {

            evHandler.handleUnsubscribe(callisto.wechatInfo.access_token, openid, function(err){
                console.log('您取消绑定');
                res.reply(err);
            } )
        }
            break;

        case 'subscribe_status': {

            deviceTrans.sendToDevice({
                "messageCode": 68,
                "cmd": 'getStatus',
                "value": 0,
                "deviceId": 43,
                "mac": '845DD74D4D9A'
            }, function(err, result){

                console.log('subscribe_status --->', err, result);
                var status = 0;
                if(err){
                    result = typeof result == 'string' ? JSON.parse(result): result;
                    if(result.errorCode == 3807)
                        status = 0;
                }

                else
                    status = 1;
                //设备上报设备状态
                wechat.api.reportDeviceConnection(callisto.wechatInfo.access_token,  message.FromUserName, device_id, status, function(err){
                    if(err)
                        return res.reply('无法获得设备状态');
                    res.reply();
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
    console.log('收到微信的消息了:', req.weixin, req.query);
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

        }

        default :{

        }
    }
}

var getOpenIdByDeviceId = function(mac, callback){

}

function handleDeviceReport(req, res){
    var deviceId = req.body.deviceId;
    var mac = req.body.mac;
    var content = req.body.content;
    var buffer = new Buffer(content);
    console.log('收到了设备数据--->', req.body, new Buffer(content));
    wechat.api.getDeviceStat(callisto.wechatInfo.access_token,  mac.toLowerCase(), function(err, result){

        if(err){
            return res.send(err);
        }

        if(result.errcode == 0 && result.status == 0 ){
            return res.send('该设备暂未被微信授权');
        }

        if(!buffer.length)
            return;

        var type = buffer[0];

        switch (type){
            case 0x03: //指纹
                var finger = buffer[buffer.length - 1] ;
                var from = buffer[2];
                if(from == 0x01){ // add 指纹OK
                    user.api.addFinger({
                        device_id: mac.toLowerCase(),
                        id: finger
                    }, function(err, result){
                        if(err)
                            return console.log(err);
                        //这里websocket通知add的结果前端

                        user.api.getDeviceByDeviceId({
                            device_id: '845dd74a6c4b'
                        }, function(err, device){
                            if(err)
                                return;
                            if(device && device.users[0].length){
                                var openId = device.users[0];
                                sockets[openId].emit('result', {errorCode: 0, errmsg:'指纹添加成功'});
                            }

                            res.send({
                                errorcode:0,
                                errmsg:'指纹添加成功'
                            });
                        });

                    });
                }else if(from == 0x02){ //remove 指纹OK
                    user.api.removeFinger({
                        device_id: mac,
                        id: finger
                    }, function(err, result){
                        if(err)
                            return console.log(err);

                        user.api.getDeviceByDeviceId({
                            device_id: '845dd74a6c4b'
                        }, function(err, device){
                            if(err)
                                return;
                            if(device && device.users[0].length){
                                var openId = device.users[0];
                                sockets[openId].emit('result', {errorCode: 0, errmsg:'指纹删除成功'});
                            }

                            res.send({
                                errorcode:0,
                                errmsg:'删除指纹成功'
                            })
                        });
                    })
                }
                break;
            case 0x04: //开门
                var fingerId = buffer[buffer.length - 1] ;
                // 微信通过模板消息的方式发送给微信客户端
                // 同时保存数据库
                //   console.log('开门指纹--》', fingerId);
                user.api.setDoorRecord('845dd74a6c4b', {
                    state: 'open',
                    fingerId: fingerId
                }, function(err, result){
                    console.log('智能柜开门操作--->', err, result);
                    var alertInfo = config.wx.template.alertInfo;
                    //设备绑定成功
                    var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                        + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                    var data = {
                        "first": {
                            "value": '报警提醒',
                            "color": "#173177"
                        },
                        "keyword1":{    //DeviceID
                            "value": '智能保险柜开门提醒, 设备id: ' + mac,
                            "color": "#173177"
                        },
                        "keyword2":{    //DeviceID
                            "value": '智能保险柜出现开门操作，请确保是本人操作！',
                            "color": "#173177"
                        },

                        "remark":{
                            "value": '时间：' + nowtime,
                            "color": "#d11a19"
                        }
                    };

                    user.api.getDeviceByDeviceId({
                        device_id: '845dd74a6c4b'
                    }, function(err, device){
                        if(err)
                            return;
                        var openId = device.users[0];
                        callisto.wechatAPI.sendTemplate(openId, alertInfo, null, data, function(){});
                    });
                })
                break;
            case 0x05:// 警告
                var id =  buffer[buffer.length - 1];
                //模板消息
                var errorInfo = config.wx.template.errorInfo;
                //设备绑定成功
                var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                    + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                var data = {
                    "first": {
                        "value": '故障提醒',
                        "color": "#173177"
                    },
                    "keyword1":{    //DeviceID
                        "value": '智能保险柜故障提醒, 设备id: ' + mac,
                        "color": "#173177"
                    },
                    "keyword2":{    //DeviceID
                        "value": '智能保险柜出现故障，可能被撬开了，请确保是本人操作！',
                        "color": "#173177"
                    },

                    "remark":{
                        "value": '时间：' + nowtime,
                        "color": "#d11a19"
                    }
                };

                user.api.getDeviceByDeviceId({
                    device_id: '845dd74a6c4b'
                }, function(err, device){
                    if(err)
                        return;
                    var openId = device.users[0];

                    user.api.setDoorRecord(mac.toLowerCase(), {
                        alert: 'open'
                    }, function(err){
                        if(err)
                            return res.send('报警记录保存失败');
                        callisto.wechatAPI.sendTemplate(openId, errorInfo, null, data, function(){});
                    });
                });
                break;
            case 0x06:
                var tempH = buffer[2];
                var tempS = buffer[3];
                var moistureH = buffer[4];
                var moistureS = buffer[5];
                var status = {};
                status.tempeture = tempH + '.' + tempS;
                status.moisture = moistureH + '.' + moistureS;/*
             user.api.updateDeviceStatus(mac.toLowerCase(), status, function(err){
             if(err)
             return console.log('上报状态保存错误---->', err);

             });*/
                user.api.getDeviceByDeviceId({
                    device_id: '845dd74a6c4b'
                }, function(err, device){
                    if(err)
                        return;
                    if(device && device.users[0].length){
                        var openId = device.users[0];
                        sockets[openId].emit('status', status);
                    }
                });

                break;
        }
    });


}

module.exports.middleWare = {
    handleWechat:  Wechat(options, handleMiddleWare.bind(callisto)),
    handleDeviceReport: handleDeviceReport
}
