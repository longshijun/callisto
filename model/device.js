var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://127.0.0.1:27017/callisto');

var schema = new Schema({
    mac: {
        type: String,
        unique:true
    },
    prototype_id: {
        type:String,
    },
    deviceType:{
        type:String,
    },
    qrcode: {
        type:String,
    },
    time: {type : Date, default: Date.now},
});

var model =  mongoose.model('Device', schema);
var dev = new model({
    mac:'1234567890',
    prototype_id:'1234567890',
    deviceType:'fuckman',
    qrcode:'fuckman'
});
dev.save(function(err, result){

});
module.exports = model;