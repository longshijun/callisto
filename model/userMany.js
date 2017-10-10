var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
mongoose.connect('mongodb://127.0.0.1:27017/callisto');

var schema = new Schema({
    device: [],
    openid:{
        type:String,
        unique:true
    },
    isOwner:false,
    time: {type : Date, default: Date.now},
    fingers: [],
});

var model =  mongoose.model('User', schema);
module.exports = model;