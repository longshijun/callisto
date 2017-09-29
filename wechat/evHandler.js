var wechat = require('../controller/wechat');
module.exports = {
    handBind: function(access_token, device_id, openid, callback){
        var self = this;
        wechat.api.bindOperation({
            device_id: device_id,
            openid: openid
        }, 'compel_bind', function(err, result){
            if(result.base_resp.errcode != 0 )
                return callback(result.base_resp);



        })
    }
}