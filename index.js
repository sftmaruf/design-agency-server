const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { cloudinary } = require('./utils/cloudinary');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 100000 }));


app.get('/', (req, res) => {
    res.send('working');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f1z8e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const serviceDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONONE);
    const feedbackDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONTWO);
    const ordersDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONTHREE);
    const adminDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONFOUR);

    console.log('connected');

    app.post('/addingService', (req, res) => {
        serviceDB.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    });

    app.get('/serviceList', (req, res) => {
        serviceDB.find({})
            .toArray((err, service) => {
                res.send(service);
            })
    });

    app.post('/submitImage', (req, res) => {
        const imageString = req.body.data;
        cloudinary.uploader.upload(imageString, {
            upload_preset: 'tur5ybh9'
        }, (err, result) => {
            console.log({ url: result.url });
            res.send({ url: result.url });
        })
    });

    app.post('/addingFeedback', (req, res) => {
        console.log(req.body);
        feedbackDB.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    });

    app.get('/feedbackList', (req, res) => {
        feedbackDB.find({}).limit(6)
            .toArray((err, feedback) => {
                res.send(feedback);
            })
    });

    app.post('/orders', (req, res) => {
        ordersDB.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    app.post('/selectedServices', (req, res) => {
        ordersDB.find({ 'email': req.body.email })
            .toArray((err, selectedServices) => {
                res.send(selectedServices);
            })
    });

    app.get('/allOrders', (req, res) => {
        ordersDB.find({})
            .toArray((err, orderDetails) => {
                res.send(orderDetails);
            })
    });

    app.post('/addingAdmin', (req, res) => {
        adminDB.insertOne({ email: req.body.email })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    app.post('/adminValidation', (req, res) => {
        adminDB.find({ 'email': req.body.email })
            .toArray((err, admin) => {
                res.send(admin.length > 0);
            })
    });

    app.post('/updateOrderState', (req, res) => {
        const id = req.body.id;
        const state = req.body.state;
        ordersDB.updateOne(
            { _id: ObjectId(id) },
            { $set: { state: state } },
            (err, res) => {
                res.send(res.modifiedCount > 0);
            }
        )

    });

});

app.listen(process.env.PORT || 5000);