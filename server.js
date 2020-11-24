const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment_timezone = require('moment-timezone');

const app = express();
const port = 8000;

const Customer = require('./models/Customer');
const Car = require('./models/Car');
const Renew_date = require('./models/Renew_date');

// --------- Body Parser Middleware ---------- //
app.set('view engine', 'ejs');
// app.use(expressLogging(logger)) // Show the log
app.use(bodyParser.json({ limit: '50mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })); // for parsing application/x-www-form-urlencoded
// app.use(multer()); // for parsing multipart/form-data

var path = __dirname + '/view/';

app.use(express.static(path));

app.get('/', (req, res) => {
    var date_now = moment_timezone().tz("Asia/Kuala_Lumpur");

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    lastDay.setHours(23)
    lastDay.setMinutes(59)

    Customer.countDocuments().exec(function (err, customer_list) {
        Car.countDocuments().exec(function (err, car_list) {
            Car.countDocuments({ latest_expiry_date: { $lte: new Date(date_now) } }).exec(function (err, car_expire) {
                Car.find({ latest_expiry_date: { $gte: new Date(firstDay), $lte: new Date(lastDay) } }).populate({ path: 'customer_id' }).exec(function (err, car_expire_within_one_moth) {
                    locals = {
                        customer_list: customer_list,
                        car_list: car_list,
                        car_expire: car_expire,
                        car_expire_within_one_moth: car_expire_within_one_moth
                    }
                    res.render(path + 'index', locals);
                });
            });
        });
    });
});

app.get('/customer', (req, res) => {
    Customer.find().exec(function (err, customer_details) {
        var locals = {
            customer_details: customer_details
        }
        res.render(path + 'customer', locals);
    });
});

app.get('/add_customer', (req, res) => {
    locals = {}
    res.render(path + 'add_customer', locals);
});

app.post('/add_customer_api', function (req, res) {
    var customer_document = new Customer({
        customer_name: req.body.customer_name,
        mobile_number: req.body.mobile_number,
        ic_number: req.body.ic_number
    });

    customer_document.save(function (err, docs) {
        if (err) return console.error(err);
        if (docs) {
            res.status(200).send('{"result" : "success.", "message": "Add Successfully.", "customer_id" : "' + docs._id + '"}');
        }
        else {
            res.status(400).send('{"result" : "fail.", "message": "Insert failed."}');
        }
    });
});

app.get('/customer_details', (req, res) => {
    Customer.findOne({ _id: req.query.customer_id }).
        populate({ path: 'registered_car' }).
        exec(function (err, customer_details) {
            if (customer_details) {
                locals = {
                    customer_details: customer_details
                }
                res.render(path + 'customer_details', locals);
            }
        });
});

app.post('/edit_customer_api', function (req, res) {
    Customer.findById(req.body.customer_id).exec(function (err, customer_details) {
        customer_details.customer_name = req.body.customer_name
        customer_details.mobile_number = req.body.mobile_number
        customer_details.ic_number = req.body.ic_number

        customer_details.save(function (err, docs) {
            if (err) return console.error(err);
            if (docs) {
                res.status(200).send('{"result" : "success.", "message": "Edit Successfully."}');
            }
            else {
                res.status(400).send('{"result" : "fail.", "message": "Edit failed."}');
            }
        });
    });
});

app.post('/delete_customer_api', function (req, res) {
    Customer.findByIdAndRemove(req.body.customer_id).exec(function (err, customer_details) {
        Car.remove({ customer_id: req.body.customer_id }).exec(function (err, car_details) {
            Renew_date.remove({ customer_id: req.body.customer_id }).exec(function (err, car_details) {
                if (customer_details) {
                    res.status(200).send('{"result" : "success.", "message": "Delete Successfully."}');
                }
                else {
                    res.status(400).send('{"result" : "fail.", "message": "Delete failed."}');
                }
            });
        });
    });
});

app.get('/car', (req, res) => {
    Car.find().
        populate({ path: 'customer_id' }).
        exec(function (err, car_list) {
            var locals = {
                car_list: car_list
            }
            res.render(path + 'car', locals);
        });
});

app.get('/add_car', (req, res) => {
    locals = {}
    res.render(path + 'add_car', locals);
});

app.post('/add_car_api', function (req, res) {
    Customer.findById(req.body.customer_id).exec(function (err, customer_details) {
        if (customer_details != null) {
            var car_document = new Car({
                customer_id: customer_details._id,
                plate_no: req.body.plate_no,
                car_models: req.body.car_models,
            });

            car_document.save(function (err, car_result) {
                if (err) return console.error(err);
                if (car_result) {
                    customer_details.registered_car.push(car_result._id)

                    customer_details.save(function (err, car_result) {
                        res.status(200).send('{"result" : "success.", "message": "Add Successfully."}');
                    })
                }
                else {
                    res.status(400).send('{"result" : "fail.", "message": "Insert failed."}');
                }
            });
        }
        else {
            res.status(400).send('{"result" : "fail.", "message": "Customer not found."}');
        }
    });
});

app.get('/car_details', (req, res) => {
    Car.findById(req.query.car_id).
        populate({ path: 'customer_id renew_date' }).
        exec(function (err, car_details) {
            locals = {
                car_details: car_details
            }
            res.render(path + 'car_details', locals);
        });
});

app.post('/edit_car_api', function (req, res) {
    Car.findById(req.body.car_id).exec(function (err, car_details) {
        car_details.plate_no = req.body.plate_no
        car_details.car_models = req.body.car_models

        car_details.save(function (err, docs) {
            if (err) return console.error(err);
            if (docs) {
                res.status(200).send('{"result" : "success.", "message": "Edit Successfully."}');
            }
            else {
                res.status(400).send('{"result" : "fail.", "message": "Edit failed."}');
            }
        });
    });
});

app.post('/delete_car_api', function (req, res) {
    Car.findByIdAndRemove(req.body.car_id).exec(function (err, car_details) {
        if (car_details) {
            res.status(200).send('{"result" : "success.", "message": "Delete Successfully."}');
        }
        else {
            res.status(400).send('{"result" : "fail.", "message": "Delete failed."}');
        }
    });
});

app.get('/renew_date', (req, res) => {
    locals = {}
    res.render(path + 'renew_date', locals);
});

app.post('/renew_date_api', (req, res) => {
    console.log(req.body)
    Car.findOne({ _id: req.body.car_id }).
        exec(function (err, car_details) {
            var renew_date_document = new Renew_date({
                customer_id: req.body.customer_id,
                car_id: req.body.car_id,
                renew_date: req.body.renew_date,
                expire_date: req.body.expire_date
            });

            renew_date_document.save(function (err, renew_date_result) {
                if (err) return console.error(err);
                if (renew_date_result) {
                    car_details.renew_date.push(renew_date_result._id)
                    car_details.latest_expiry_date = req.body.expire_date

                    car_details.save(function (err, car_result) {
                        res.status(200).send('{"result" : "success.", "message": "Add Successfully."}');
                    })
                }
                else {
                    res.status(400).send('{"result" : "fail.", "message": "Insert failed."}');
                }
            });
        });
});

app.get('/blank', (req, res) => {
    locals = {}
    res.render(path + 'blank', locals);
});

app.get('/expired_car', (req, res) => {
    var date_now = moment_timezone().tz("Asia/Kuala_Lumpur");

    Car.find({ latest_expiry_date: { $lte: new Date(date_now) } }).populate({ path: 'customer_id' }).exec(function (err, car_expire) {
        var locals = {
            car_expire: car_expire
        }
        res.render(path + 'expired_car', locals);
    });
});

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

const db_url = "mongodb://localhost:27017/car_system";

mongoose.connect(db_url, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    app.listen(8002);
    // app.listen(1001);
    app.listen(port, function () {
        console.log("Server running ", port);
    });
});