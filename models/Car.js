const mongoose = require('mongoose'), Schema = mongoose.Schema;

const carSchema = mongoose.Schema({
    customer_id: {
        type: Schema.Types.ObjectId,
        ref: 'customer'
    },
    plate_no: {
        type: String
    },
    car_models: {
        type: String
    },
    renew_date: {
        type: [{ type: Schema.Types.ObjectId, ref: 'renew_date' }]
    },
    latest_expiry_date: {
        type: Date,
        default: null
    },
    create_date: {
        type: Date,
        require: true,
        default: Date.now()
    }
});

module.exports = mongoose.model('car', carSchema);