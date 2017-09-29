var wxDevice = require('../model/wxDevice');
var Device = require('../model/Device');
var getDeviceById = function(device_id, callback){
    Device.findOne({
        mac: device_id
    }, function(err, device){
        if(err)
            return callback(err);
        if(!device)
            return callback({
                errorCode:1002,
                errMsg:'未知设备'
            });
        wxDevice.findOne({
            device_id: device_id
        }).populate('users').exec(function(err, result){
            console.log(err, result);
        })
    })
}

getDeviceById('1234567890', function(){

});
