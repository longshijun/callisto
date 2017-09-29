var domain_name = 'http://62356077.ngrok.io';

var OAuth = require('wechat-oauth');
var convertToAuthorizeURL = function(url, appId, appSecret, scope) {
    var	oauth = new OAuth(appId, appSecret),
        nonce = 2;
    return oauth.getAuthorizeURL(url, nonce, scope);
};

var wechat = {
    "weixin_domain":"api.weixin.qq.com/cgi-bin",
    "database":"callisto",
    "wx": {
        "appid": "wxddde5e1ef8ae18b1",
        "secret": "8f15e038b5a862aa89d6584a91b3f44e",
        "scope"  : 'snsapi_base',//snsapi_userinfo snsapi_base

        //wukoon
        /* "appid":"wxc5fd7915e305622c",
         "secret":"2d138f083de3633b7c99ed16e923a749",*/
        "token":"1234567890",
        "weixin_hostname" : "api.weixin.qq.com",
        "weixin_port"     : 443,
        "weixin_primitive_ID": "gh_f9c3fa847025",
        "product_id":'',
        "product_id":41375,
        "type":"smart_device",
        "wx_menu": {
            "button": [
                {
                    "name": "菜单",
                    "sub_button": [
                        {
                            "type": "view",
                            "name": "资讯菜单",
                            "url": convertToAuthorizeURL(domain_name + '/user/page', 'wxddde5e1ef8ae18b1',  '8f15e038b5a862aa89d6584a91b3f44e', 'snsapi_base')
                        }
                    ]
                },
                {
                    "name": "菜单2",
                    "sub_button": [
                        {
                            "type": "view",
                            "name": "我的11",
                            "url": "https://hw.weixin.qq.com/devicectrl/panel/device-list.html?appid=wxddde5e1ef8ae18b1"
                        }
                    ]
                },
                {
                    "name": "助理",
                    "sub_button": [
                        {
                            "type": "view",
                            "name": "大学",
                            "url": "http://www.baidu.com"
                        },
                        {
                            "type": "view",
                            "name": "社区",
                            "url": "http://www.baidu.com"
                        }
                    ]
                }
            ]
        }
    }
}
module.exports = wechat;