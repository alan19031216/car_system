const mongoose = require('mongoose'), Schema = mongoose.Schema;

const customerSchema = mongoose.Schema({
    customer_name: {
        type: String
    },
    mobile_number: {
        type: Number
    },
    ic_number: {
        type: Number
    },
    registered_car: {
        type: [{ type: Schema.Types.ObjectId, ref: 'car' }]
    },
    create_date: {
        type: Date,
        require: true,
        default: Date.now()
    }
});

module.exports = mongoose.model('customer', customerSchema);