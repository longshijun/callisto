var domain_name = 'http://weixin.china-pingan.com';

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
/*        "appid": "wx1b43042ea6429da7",
        "secret": "fb7a610e1ff1cd2d87033ba821dd42ea",*/
        "scope"  : 'snsapi_base',//snsapi_userinfo snsapi_base

        //wukoon
         "appid":"wxc5fd7915e305622c",
         "secret":"e852f98982ed0870fbd3a953222c43fd",
        "token":"1234567890",
        "weixin_hostname" : "api.weixin.qq.com",
        "weixin_port"     : 443,
        "weixin_primitive_ID": "gh_eb1d2050fea3", // wukoon gh_a1add65ebcdf
        "product_id":46085,
        "type":"fridge",
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
                            "name": "我的设备",
                            "url": domain_name + '/device/list'
                  /*          "url": convertToAuthorizeURL(domain_name + '/device/list', 'wx1b43042ea6429da7',  'fb7a610e1ff1cd2d87033ba821dd42ea', 'snsapi_base')*/
                        }
                    ]
                }

            ]
        }
    }
}
module.exports = wechat;
