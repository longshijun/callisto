var OAuth = require('wechat-oauth');
var url = require('url');
var config = require('../config');


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
    }

}