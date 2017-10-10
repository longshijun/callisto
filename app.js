var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require("url");
var crypto = require("crypto");
var config = require('./config');
var app = express();
var session = require('express-session');
var router = require('./router/index');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
        secret: 'workingDir',
        cookie: {
            maxAge: 600 * 1000 * 1024
        },
        resave:true
    }
));
function sha1(str) {
    var shasum = crypto.createHash('sha1');
    shasum.update(str);
    return shasum.digest('hex');
}
/*app.use('/wechat',function(req, res, next){
    var query = url.parse(req.url,true).query;
    var signature = query.signature;
    var echostr = query.echostr;
    var timestamp = query['timestamp'];
    var nonce = query.nonce;
    var oriArray = new Array();
    oriArray[0] = nonce;
    oriArray[1] = timestamp;
    oriArray[2] = "1234567890";//这里是你在微信开发者中心页面里填的token，而不是****
    oriArray.sort();
    var original = oriArray.join('');
    console.log("Original str : " + original);
    console.log("Signature : " + signature );
    var scyptoString = sha1(original);
    if(signature == scyptoString){
        res.send(echostr);
     //   res.write(echostr);
        console.log("Confirm and send echo back");
    }else {
        res.end("false");
        console.log("Failed!");
    }
})*/

app.use(router);
app.listen(80);

module.exports = app;
