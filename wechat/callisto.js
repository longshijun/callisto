var request = require('request');
var _ = require('lodash');
var Wechat = require('wechat');
var config = require('../config');
var fs = require('fs');
function Callisto (){
    this.wechatAPI = new (require('wechat-api'))(config.wx.appid, config.wx.secret);
    this.controller = {};
    this.wechatInfo = {};
}
function init(){
    var self = this;
}

Callisto.prototype.start = function(){
    var self = this;
    this.wechatAPI.createMenu(config.wx.wx_menu, function(err, result){
        console.log('create menu--->', err, result);
    });
    this.wechatAPI.getLatestTicket(function(err, result) {
        if(err)
            throw new Error(err);
        self.controller.wechatInfo = {
            ticket : result.ticket,
            wechatAPI: self.wechatAPI
        };
    });
    this.wechatAPI.getLatestTicket(function(err, result) {

        if(!err) {
          //  self.controller.wechatInfo.ticket = result.ticket;
            var result = JSON.stringify(result)
            console.log('===============ticket============', JSON.parse(result).ticket );
        }
        else {
            console.error('Error getting ticket : ' + err);
        }
    });
    setInterval(function(){
        self.getLastedAccessToken(function(err, access_token){
            if(err)
                throw new Error(err);
            console.log('获得access token成功！', access_token);
            self.wechatInfo.access_token = access_token;
        });
    }, 7100000)
    self.getLastedAccessToken(function(err, access_token){
        if(err)
            throw new Error(err);
        console.log('获得access token成功！', access_token);
        self.wechatInfo.access_token = access_token;
    });
}

Callisto.prototype.getLastedAccessToken = function(callback){
    var sel= this;
    //https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxe000c39f6df8b1e7&secret=2d138f083de3633b7c99ed16e923a749

    var url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + config.wx.appid + '&secret=' + config.wx.secret
    request.get({url: url, json: true}, function(err, res, body) {
        if (!!body && _.isObject(body) && _.isString(body.access_token)) {
            console.log('get Token: ', body.access_token);
            return callback && callback(null, body.access_token);
        }

        callback && callback(err || -1);
    });
}

var callisto = new Callisto();

module.exports = callisto;