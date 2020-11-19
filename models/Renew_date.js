const mongoose = require('mongoose'), Schema = mongoose.Schema;

const renew_dateSchema = mongoose.Schema({
    customer_id: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    car_id: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    renew_date: {
        type: Date
    },
    expire_date: {
        type: Date
    },
    create_date: {
        type: Date,
        require: true,
        default: Date.now()
    }
});

module.exports = mongoose.model('renew_date', renew_dateSchema);