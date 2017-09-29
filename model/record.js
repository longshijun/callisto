var mongoose = require('mongoose');
var Schema = mongoose.Schema;


mongoose.connect('mongodb://127.0.0.1:27017/callisto');

var schema = new Schema({
    device:{
        type: Schema.Types.Mixed,
    },
    openid: {
        type:String,
    },
    status:{
        type: Schema.Types.Mixed
    },
    time: {type : Date, default: Date.now},
    fingers: [],
});

var model =  mongoose.model('Record', schema);
module.exports = model;