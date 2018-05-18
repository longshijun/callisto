var Wechat = require('wechat');
var config = require('../config');
var callisto = require('./callisto');
var user = require('../controller/user-many');
var wechat = require('../controller/wechat');
var fs = require('fs');
var evHandler = require('./evHandler');
var url = require('url');
var deviceTrans = require('../controller/device');
var _ = require('lodash');
callisto.start();
var sockets = {};


setTimeout(function(){
   // console.log('---->', callisto.controller.socketio);
    var openid = '';
    callisto.controller.socketio.of('/chat').on('connection', function (socket) {
        console.log('socketio 链接成功: ');
        socket.on('client', function (data) {
            console.log('收到了了数据 socketid 的openid：',data);
            openid = data.openid;
            console.log('data from client:', data);
            if (!sockets[openid])
                sockets[openid] = socket;
        }).on('disconnect', function () {
          //  delete sockets[openid];
        });
    });
});

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

                console.log('设备绑定结果--》', err, result);
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

            evHandler.handleUnsubscribe(callisto.wechatInfo.access_token, message.FromUserName, function(err){
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
                "mac": /*'845DD74D4D9A'*/device_id.toUpperCase()
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
            if(sockets[message.FromUserName])
                delete sockets[message.FromUserName];
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
/*
    wechat.api.getDeviceStat(callisto.wechatInfo.access_token,  mac.toLowerCase(),  /!*'845dd74a6c4b'*!/ function(err, result){

        if(err){
            return res.send(err);
        }

        if(result.errcode == 0 && result.status == 0 ){
            return res.send('该设备暂未被微信授权');
        }


    });
*/
    if(!buffer.length)
        return;

    var type = buffer[0];

    switch (type){
        case 0x03: //指纹
            var finger = buffer[buffer.length - 1] ;
            var from = buffer[2];
            if(from == 0x01){ // add 指纹OK
                user.api.addFinger({
                    device_id: mac.toLowerCase() /*'845dd74a6c4b'*/,
                    id: finger
                }, function(err, result){
                    if(err)
                        return console.log(err);
                    //这里websocket通知add的结果前端

                    user.api.getDeviceByDeviceId({
                        device_id: mac.toLowerCase()
                    }, function(err, device){
                        if(err)
                            return;
                        if(device && device.users[0].length){
                            var openId = device.users[0];
                            var socket = sockets[openId];
                            if(socket)
                                socket.emit('fingerAdd', {errorCode: 0,  type:'fingerAdd', finger: finger});

                        }

                        var bindSuccessInfo = config.wx.template.alertInfo;
                        //设备绑定成功
                        var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                            + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                        var data = {
                            "first": {
                                "value": '设备指纹添加成功',
                                "color": "#173177"
                            },
                            "keyword1":{    //DeviceID
                                "value": 'mac  ' + mac  + '指纹id：' + finger,
                                "color": "#173177"
                            },
                            "keyword2": {  //device name
                                "value": '智能保险柜' ,
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
                        callisto.wechatAPI.sendTemplate(openId, bindSuccessInfo, null, data, function(){});

                        res.send({
                            errorcode:0,
                            errmsg:'指纹添加成功'
                        });
                    });

                });
            }else if(from == 0x02){ //指纹添加失败K

            }
            break;
        case 0x04: //开门
            var fingerId = buffer[buffer.length - 1] ;
            // 微信通过模板消息的方式发送给微信客户端
            // 同时保存数据库
            //   console.log('开门指纹--》', fingerId);
            var warningText = '智能保险柜出现开门操作，请确保是本人操作！';
            user.api.getDeviceByDeviceId({
                device_id: mac.toLowerCase() // mac.toLowerCase
            }, function(err, device){
                if(err)
                    return;
                var openId = device.users[0];

                var index = _.findIndex(device.fingers, function(chr) {
                    return chr.id == fingerId;
                });

                var saveDoorOpen = function(type, finger){
                    console.log('智能柜开门操作--->', finger);
                    user.api.setDoorRecord(mac.toLowerCase(), type, {
                        state: warningText,
                        finger: finger
                    }, function(err, result){

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
                        callisto.wechatAPI.sendTemplate(openId, alertInfo, null, data, function(){});
                        res.send({
                            errorcode:0,
                            errmsg:'保存开门操作成功'
                        });

                    })

                }

                if(index > -1){
                    saveDoorOpen('door', device.fingers[index]);
                }else{
                    saveDoorOpen('door', {
                        id: fingerId,
                        name:'未知指纹'
                    });
                }



            });

            break;
        case 0x05:// 警告
            //var warningId =  buffer[buffer.length - 1];
            //模板消息
            var errorInfo = config.wx.template.errorInfo;
            //设备绑定成功
            var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
            var warningId =  buffer[2];
            var warningText = '';
            switch (warningId){
                case 1:
                    warningText = '保险柜被移动';
                    break;
                case 2:
                    warningText = '连续输错密码3次';
                    break;
                case 3:
                    warningText = '忘记关门';
                    break;
                default:
                    warningText = '保险柜出现了警告，请及时查看！';

            }
            console.log('警告id:', buffer, warningId, warningText);
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
                    "value": '警告：' + warningText,
                    "color": "#173177"
                },

                "remark":{
                    "value": '时间：' + nowtime,
                    "color": "#d11a19"
                }
            };

            user.api.getDeviceByDeviceId({
                device_id: mac.toLowerCase()
            }, function(err, device){
                if(err)
                    return;
                var openId = device.users[0];

                user.api.setDoorRecord(/*mac.toLowerCase()*/ mac.toLowerCase(), 'alert', {
                    alert: warningText,
                }, function(err){
                    if(err)
                        return res.send({
                            errorcode: -1,
                            errmsg:'保存开门操作失败'
                        });
                    callisto.wechatAPI.sendTemplate(openId, errorInfo, null, data, function(){});

                    user.api.getDeviceByDeviceId({
                        device_id: mac.toLowerCase()
                    }, function(err, device){
                        if(err)
                            return ;
                        if(device && device.users[0].length){
                            var openId = device.users[0];
                            var socket = sockets[openId];
                            if(socket)
                                socket.emit('record', {errorCode: 0, type:'record' });
                        }
                        res.send({
                            errorcode:0,
                            errmsg:'保存开门操作成功'
                        });
                    })



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
            status.moisture = moistureH + '.' + moistureS;
            console.log('获得温度湿度：', status);
            user.api.getDeviceByDeviceId({
                device_id: mac.toLowerCase()
            }, function(err, device){
                if(err)
                    return;
                if(device && device.users[0].length){
                    var openId = device.users[0];
                    var socket = sockets[openId];
                    if(socket){
                        console.log('发送数据温度ok:', status);
                        socket.emit('status', status);
                    }


                }
            });

            break;
        case 0x07: //指纹删除请求
            var finger = buffer[buffer.length - 1] ;
            var from = buffer[2];
            if(from == 0x01){
                user.api.removeFinger({
                    device_id: mac.toLowerCase(),
                    id: finger
                }, function(err, result){
                    if(err)
                        return console.log(err);

                    user.api.getDeviceByDeviceId({
                        device_id: mac.toLowerCase()
                    }, function(err, device){
                        if(err)
                            return;
                        if(device && device.users[0].length){
                            var openId = device.users[0];
                            var socket = sockets[openId];
                            if(socket)
                                socket.emit('fingerRemove', {errorCode: 0, type:'fingerRemove', finger: finger});

                            var bindSuccessInfo = config.wx.template.alertInfo;
                            //设备绑定成功
                            var nowtime = new Date().getFullYear() + '年' + (new Date().getMonth()+1) + '月' + new Date().getDate() + '日 '
                                + new Date().getHours() + ':' + new Date().getMinutes()+ ':' + new Date().getSeconds();
                            var data = {
                                "first": {
                                    "value": '设备指纹删除成功',
                                    "color": "#173177"
                                },
                                "keyword1":{    //DeviceID
                                    "value": 'mac  ' + mac  + '指纹id：' + finger,
                                    "color": "#173177"
                                },
                                "keyword2": {  //device name
                                    "value": '智能保险柜' ,
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
                            callisto.wechatAPI.sendTemplate(openId, bindSuccessInfo, null, data, function(){});

                        }
                        res.send({
                            errorcode:0,
                            errmsg:'删除指纹成功'
                        })
                    });
                })
            }else{

            }

            break;
        case 0x09: //删除所有指纹
            var type = buffer[buffer.length - 1] ;
            user.api.removeAllRecords(mac.to, function(){});

            if(type == 0x01){
                user.api.getDeviceByDeviceId({
                    device_id: mac.toLowerCase()
                }, function(err, device){
                    if(err)
                        return;
                    if(device && device.users[0].length){
                        var openId = device.users[0];
                        var socket = sockets[openId];
                        user.api.removeAllFingers(mac.toLowerCase(), function(err){
                            user.api.removeAllRecords(mac.toLowerCase(), function(){})
                            if(socket)
                                socket.emit('removeAll', {errorCode: 0, type:'fingerRemove', errmsg:'指纹全部删除成功'  });
                        });
                    }

                })
            }else if(type == 0x02){

            }

            break;
    }


}

module.exports.middleWare = {
    handleWechat:  Wechat(options, handleMiddleWare.bind(callisto)),
    handleDeviceReport: handleDeviceReport
}
