var https = require('https'),
    assert = require('assert'),
    request = require('request'),
    config = require('../config');


var	MSG_TYPE_CONNECTION= '2'


var common = {
    //api.batchGetUsers(['openid1', 'openid2'], callback)
    batchGetUsers: function(){
        self.wechatAPI.batchGetUsers (users, function(err, result){
            if(err)
                return callback(err);
            var userlist = [];
            userlist = result.user_info_list || [];
            return callback(null, userlist);
        });
    },
    //device information
    getQRCode: function(accessToken, callback){
        var weixin_port = 443;
        var weixin_host	= 'api.weixin.qq.com';
        var url = 'https://' + weixin_host + '/device/getqrcode?access_token=' + accessToken;

        request.get(url, function(e, r, body) {

            if(r.statusCode !== 200) {
                callback(e);
            }
            else {
                var body = JSON.parse(body);

                if(body.errcode && body.errcode !== 0) {
                    return callback(body);
                }

                if(body.base_resp.errcode !== 0) {
                    return callback(body.base_resp);
                }
                else {
                    callback(undefined, body.deviceid, body.qrticket);
                }
            }
        });
    },

     verify_qrcode: function(data, callback){
         /*
            data = {
                ticket:'qrticket'
            }
          */
        request.post({
            uri		: 'https://api.weixin.qq.com/device/verify_qrcode?access_token=' + access_token,
            method	: 'POST',
            body	: data,
            json	: true
        }, function(e, r, body){

            if(!!e)
                return  console.log('授权设备- rr--->', e, body);

            console.log('授权设备---->', e, body);
            /*
             { errcode: 0,
             errmsg: 'ok',
             device_type: 'gh_f9c3fa847025',
             device_id: 'gh_f9c3fa847025_49f6dfef1679816c',
             mac: '' }

             */
            if(body.errcode == 0)
                return callback(null, body);
            else
                return callback(body);
        });
    },
    authorizeDevice: function(did, mac, accessToken, productId, callback ){
        var b = {
            device_num: '1',
            device_list:
                [{
                    id: did,
                    mac: mac,
                    connect_protocol: '4',
                    auth_key: '000102030405060708090a0b0c0d0e0f',
                    close_strategy: '1',
                    conn_strategy: '1',
                    crypt_method: '0',
                    auth_ver: '0',
                    manu_mac_pos: '-2',
                    ser_mac_pos: '-2' }],
            op_type: '1'
        };
        if(productId) {
            b.product_id = productId;
            b.op_type = '0';
        }

        request.post({
            uri		: 'https://api.weixin.qq.com/device/authorize_device?access_token=' + accessToken,
            method	: 'POST',
            body	: b,
            json	: true
        }, function(e, r, body){

            if(!!e)
                return callback(e);

            if( !!body.errcode && body.errcode !== 0)
                return callback(body);

            var item = body.resp[0];
            if(item.errcode !== 0) {
                callback({
                    errcode : item.errcode,
                    errmsg : item.errmsg
                });
            }
            else {
                callback(undefined, item.base_info);
            }
        });
    },
     bindOperation : function(data, bind, callback) {

        var self = this;
        var options = {
            hostname  : 'api.weixin.qq.com',
            port      :  443,
            path      : '/device/' + bind + '?access_token=' + access_token,
            method    : 'POST',
            headers   : {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(data).length
            }
        };

        var req = https.request(options, function(res) {
            res.on('data', function (reply) {
                callback(null, reply.toString());
            })
        });

        req.on('error', function(err) {
            console.error('error :' + err.message);
            callback(err.message);
        });

        if(data)
            req.write(JSON.stringify(data));

        req.end();
    }

}

function _transmsg(accessToken, data, callback) {

    var self = this;

    console.log('----------  transmsg--------------', data);
    var options = {
        hostname: config.wx.weixin_hostname,
        port: config.wx.weixin_port,
        path:'/device/transmsg?access_token='+accessToken,
        method: 'POST',
        headers : {
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(data).length
        }
    };

    var req = https.request(options, function(res) {
        res.on('data', function (reply) {
            console.log('----------  reply  _transmsg--------------');
            console.log(reply.toString());
            callback(null, reply.toString());
        });
    });

    req.on('error', function(err) {
        console.error('error :' + err.message);
        callback(err.message);
    });

    if(data)
        req.write(JSON.stringify(data));
    req.end();
}

var api = {

    bind : function(data, callback) {

        var self = this;
        var options = {
            hostname  : config.wx.weixin_hostname,
            port      : config.wx.weixin_port,
            path      : '/device/bind?access_token=' + self.wechatInfo.access_token,
            method    : 'POST',
            headers   : {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(data).length
            }
        };

        var req = https.request(options, function(res) {
            res.on('data', function (reply) {
                console.log(reply.toString());
                callback(null, reply.toString());
            });
        });

        req.on('error', function(err) {
            console.error('error :' + err.message);
            callback(err.message);
        });

        if(data)
            req.write(JSON.stringify(data));

        req.end();
    },

    unbind : function(data, callback) {

        var self = this;

        var options = {
            hostname  : config.wx.weixin_hostname,
            port      : config.wx.weixin_port,
            path      : '/device/unbind?access_token=' + self.wechatInfo.access_token,
            method    : 'POST',
            headers   : {
                'Content-Type': 'application/json',
            }
        };

        var req = https.request(options, function(res) {
            res.on('data', function (reply) {
                console.log(reply.toString());
                callback(null, reply.toString());
            });
        });

        req.on('error', function(err) {
            console.error('error :' + err.message);
            callback(err.message);
        });

        if(data)
            req.write(JSON.stringify(data));

        req.end();
    },

    compelUnbind : function(access_token, data, callback) {

        var self = this;
        console.log('api:wechat:compelUnbind E', access_token, data);

        var options = {
            hostname  : config.wx.weixin_hostname,
            port      : config.wx.weixin_port,
            path      : '/device/compel_unbind?access_token=' + access_token,
            method    : 'POST',
            headers   : {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(data).length
            }
        };
        var req = https.request(options, function(res) {
            res.on('data', function (reply) {
                self.logger.d('------   reply compelUnbind---------');
                self.logger.e(JSON.parse(reply));
                callback(null, JSON.parse(reply));
            });
        });

        req.on('error', function(err) {
            console.error("comple-unbind-err ", err);
            callback(err.message);
        });

        req.write(JSON.stringify(data));
        req.end();
    },

    reportDeviceConnection: function(accessToken, openId, device_id, connected, callback) {

        console.log('reportDeviceConnection token :' + accessToken);
        this._transmsg.call(this, accessToken,
            {
                device_type   : config.wx.weixin_primitive_ID,
                device_id     : device_id,
                open_id       : openId,
                msg_type      : MSG_TYPE_CONNECTION,
                device_status : connected ? '1' : '0'
            },
            callback
        );
    },

    registerDevice : function(mac, device_id, callback) {

        var self = this;
        var wechatAPI = self.controller.wechatInfo.wechatAPI;
        wechatAPI.getLatestToken(function(err, data) {

            if(err) {
                return callback(err);
            }

            common.authorizeDevice(mac, mac, data.accessToken, config.wx.product_id, function(err, info) {
                if(err) {
                    console.error('Failed to authorize device : ' + err.errmsg);
                    callback(err);
                }
                else {
                    console.log('-------------->',info);
                    var d = {
                        wxDevId	    : info.device_id,
                        mac	        : mac,
                        deviceType  : config.type,
                        name        : config.type,
                        device_id	: device_id
                    };
                    callback(null, d);
                }
            });
        });
    },

    //add by dennis
    getBoundDevice : function(openid, access_token, callback) {
        var weixin_host = 'api.weixin.qq.com';
        var url = 'https://' +weixin_host + '/device/get_bind_device?access_token='+access_token+'&openid='+ openid;
        request.get(url, function(err, res, body) {
            if(err)
                return callback(err);

            var body = JSON.parse(body);
            if(body.resp_msg.ret_code !== 0)
                return callback(body.resp_msg);

            callback(null, body.device_list);
        });
    },
    getDeviceByOpenid: function(device_id, device_type, access_token, callback){
        var weixin_host = 'api.weixin.qq.com';
        var url = 'https://' +weixin_host + '/device/get_openid?access_token='+access_token+'&device_id='+ '&device_type=' + device_type;
        request.get(url, function(err, res, body) {
            if(err)
                return callback(err);

            var body =  typeof body == 'string'? JSON.parse(body): body;
            if(body.resp_msg.ret_code !== 0)
                return callback(body.resp_msg);

            callback(null, body.open_id);
        });
    },
    getDeviceStat: function(access_token, device_id, callback){
        var weixin_host = 'api.weixin.qq.com';
        var url = 'https://' +weixin_host + '/device/get_openid?access_token='+access_token+'&device_id='+ '&device_type=' + device_type;
        request.get(url, function(err, res, body) {
            if(err)
                return callback(err);

            var body =  typeof body == 'string'? JSON.parse(body): body;
            if(body.errcode !== 0)
                return callback(body);
            callback(null, body);
        });
    },

    bindOperation : function(data, bind, callback) {

        var self = this;
        var options = {
            hostname  : 'api.weixin.qq.com',
            port      :  443,
            path      : '/device/' + bind + '?access_token=' + access_token,
            method    : 'POST',
            headers   : {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(data).length
            }
        };

        var req = https.request(options, function(res) {
            res.on('data', function (reply) {
                callback(null, reply.toString());
            })
        });

        req.on('error', function(err) {
            console.error('error :' + err.message);
            callback(err.message);
        });

        if(data)
            req.write(JSON.stringify(data));

        req.end();
    }

};
module.exports = {
    common: common,
    api: api
}


