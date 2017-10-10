var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
mongoose.connect('mongodb://127.0.0.1:27017/callisto');

var schema = new Schema({
    /* _id: Schema.Types.ObjectId,*/
    users: [],
    fingers:[],
    device_id:{
        type:String,
    },
    mac: {
        type: 'string',
    },

    prototype_id: {
        type:String,
    },

    deviceType: {
        type:String,
    },
    status:{
        type: Schema.Types.Mixed
    },

    qrcode: {
        type:String,
    },
    time: {type : Date, default: Date.now },
});

var model =  mongoose.model('wxDevice', schema);
module.exports = model;