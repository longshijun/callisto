var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

mongoose.connect('mongodb://127.0.0.1:27017/callisto');

var schema = new Schema({
    device_id: {
        type: String,
    },

    door: {
        type: Schema.Types.Mixed,
    },
    alert: {
        type: String,
        default: 'closed'
    },
    time: { type : Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },

});

var model =  mongoose.model('Record', schema);
module.exports = model;