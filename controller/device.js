
var crypto = require("crypto");
var fs = require('fs');
var http = require('http');
var access_key = 'd85980b540e7b90380d3553cafa5e012';
var secret_key = '75c5b80740d613c080b1baa1df55ae60';

function sha1(str) {
    var shasum = crypto.createHmac('sha256', secret_key);
    //   var shasum = crypto.createHmac('sha256', '1f51e87340888d30805fa8a86de72730');
    shasum.update(str);
    return shasum.digest('hex');
}

var UtcTime = function(){
    var d = new Date();
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth() + 1 ;
    var day = d.getUTCDate();
    var hours = d.getUTCHours();
    var minutes = d.getUTCMinutes();
    var seconds = d.getUTCSeconds();
    var utcDate = Date.UTC(year,month,day,hours, minutes, seconds);
    console.log(year, month, day, hours, minutes, seconds)
    return utcDate;
}

exports.sendToDevice = function(data, callback){
    var obj = {
        "X-Zc-Timeout": 1000*60,
        "X-Zc-Timestamp": Math.round(new Date().getTime()/1000),
        "X-Zc-Nonce": 'QygfuOesbGX4Ftvd',
        "X-Zc-Developer-Id":474,
        "Method":"test",
        "X-Zc-Major-Domain":"jbl",
    }
    var arr = [];
    for(var key in obj)
        arr.push(obj[key]);

    var original = arr.join('');
    var signiture = sha1(original);
    obj['X-Zc-Developer-Signature'] = signiture;
    obj['X-Zc-Access-Key'] = access_key;
    var  requestData =  function(headers,  callback) {

        var self = this;
        /*var data = {
            "messageCode": 68,
            "cmd": 'addFinger',
            "value": 13,
            "mac": '845DD74D4D9A',
            "deviceId":43
        }*/
        var options = {
            hostname  : 'test.ablecloud.cn',
            port      :  5000,
            /* path      : '/zc-account/v1/sendVerifyCode',*/
            path: '/myDemoService/v1/test',
            method    : 'POST',
            headers   : {
                'Content-Length': JSON.stringify(data).length,
                "Content-Type":"application/x-zc-object",
                "X-Zc-Timeout": headers['X-Zc-Timeout'],
                "X-Zc-Timestamp": headers['X-Zc-Timestamp'],
                "X-Zc-Nonce": headers['X-Zc-Nonce'],
                "X-Zc-Developer-Id":  headers["X-Zc-Developer-Id"],
                "Method":headers["Method"],
                "X-Zc-Major-Domain": headers["X-Zc-Major-Domain"],
                "X-Zc-Developer-Signature": headers['X-Zc-Developer-Signature'] ,
                "X-Zc-Access-Key": headers["X-Zc-Access-Key"]
            }
        };
        var req = http.request(options, function(res, body, err) {
            console.log(res.statusCode, res.headers);
            if(res.statusCode == 200){

                if(res.headers["x-zc-msg-name"] == 'X-Zc-Ack'){
                    res.on('data', function (reply) {
                        return callback(null, reply.toString());
                    })
                }else if(res.headers["x-zc-msg-name"] == 'X-Zc-Err'){
                    res.on('data', function (reply) {
                        return callback(res.headers["x-zc-msg-name"], reply.toString());
                    })
                }
            }
        });

        req.on('error', function(err) {
            console.error('error :' + err.message);
            callback(err.message);
        });

        console.log('data:' , data);
        req.write(JSON.stringify(data));
        req.end();

    }

    requestData(obj, function(err, result){
        return callback(err, result);
    })

}
exports.getFinger = function(arr){

    if(arr.length == 0){
        arr.push(1);
        return arr[0];
    } else if(arr.length == 1){
        if(arr[0] == 1){
            arr.push(arr[arr.length-1] + 1);
            return arr[arr.length-1];
        } else{
            arr.unshift(arr[arr.length - 1] - 1);
            return arr[1];
        }
    }else if(arr.length > 1){
        if(arr[0] == 1 ){
            for(var i=0; i<arr.length; i++){

                if(arr.length - 1 == i){
                    arr.push(arr[arr.length - 1] + 1);
                    return arr[arr.length -1];
                }

                if(arr[i+1] - arr[i] > 1){
                    arr.splice(i+1, 0, arr[i] + 1);
                    return arr[i+1];
                }else
                    continue;
            }
        }else{
            arr.unshift(arr[0] - 1);
            return arr[0];
        }
    }
}
