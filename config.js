var domain_name = 'http://dreamip.top';

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
    /*    "appid": "wxddde5e1ef8ae18b1",
        "secret": "8f15e038b5a862aa89d6584a91b3f44e",*/
        "scope"  : 'snsapi_base',//snsapi_userinfo snsapi_base

        //wukoon
         "appid":"wxc5fd7915e305622c",
         "secret":"e852f98982ed0870fbd3a953222c43fd",
        "token":"1234567890",
        "weixin_hostname" : "api.weixin.qq.com",
        "weixin_port"     : 443,
        "weixin_primitive_ID": "gh_a1add65ebcdf",
        "product_id":'',
        "product_id":41375,
        "type":"smart_device",
        "template":{
            bindSuccessInfo: 'hbO4HYlpnW6GfxC29J1e49gMAGWwQOCNoESVzjLJM_c',
            /*
             {first.DATA}}
             设备ID：{{keyword1.DATA}}
             设备名称：{{keyword2.DATA}}
             绑定时间：{{keyword3.DATA}}
             {{remark.DATA}}
             */
            bindFailInfo:'94s8Lt_tvwXWcq1opqBpkEbkP6F8q4Jm3RHwkfuMcHE',
            /*
                 {{first.DATA}}
                 设备ID：{{keyword1.DATA}}
                 绑定结果：{{keyword2.DATA}}
                 绑定时间：{{keyword3.DATA}}
                 {{remark.DATA}}

             */
            alertInfo: 'JxWJ176rF9P8QctbrAYux3z96s7X2E8wxnwKpE4g0cE',
            /*
             {{first.DATA}}
             设备类型：{{keyword1.DATA}}
             告警内容：{{keyword2.DATA}}
             {{remark.DATA}}
             */
            errorInfo: 'n4feitCslnjoKx-3h82VX1jyoXHpui8Odj603QDFsnI'
                /*
                     {{first.DATA}}
                     故障类型：{{keyword1.DATA}}
                     故障时间：{{keyword2.DATA}}
                     {{remark.DATA}}
                 */

        },
        "wx_menu": {
            "button": [
                {
                    "name": "菜单",
                    "sub_button": [
                        {
                            "type": "view",
                            "name": "资讯菜单",
                            "url": convertToAuthorizeURL(domain_name + '/device/list', 'wxc5fd7915e305622c',  '2d138f083de3633b7c99ed16e923a749', 'snsapi_base')
                        },
                        {
                            "type": "view",
                            "name": "用户列表",
                            "url":  domain_name + '/device/list'
                        }
                    ]
                },
                {
                    "name": "用户管理",
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