var express = require('express');
var router = express.Router();
var middleWare = require('../wechat/middleWare').middleWare;
var config = require('../config');
router.post('/wechat',  middleWare.handleWechat);
var controller = require('../controller/index');
router.get('/user/page', function(req, res){
    controller.silentAuthorization(req, config, function(err, result){
        if(err)
            return console.error('授权错了:',err);
        console.log('授权OK:', result);
        res.send({
            name:'fick'
        })
    });
});

router.post('/user/list', controller.getUserList);
router.post('/user/unbind', controller.unbind);
module.exports = router;