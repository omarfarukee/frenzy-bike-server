require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET)
const port = process.env.PORT || 5000
const app = express()

const jwt = require('jsonwebtoken')


app.use(cors())
app.use(express.json())


function verifyJWT(req, res, next) {
    // console.log('token', req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorize Access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
           return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next()
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xdpsuxi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        const bikesCollection = client.db('bikes').collection('bikeCategory')
        const itemsCollection = client.db('bikes').collection('items')
        const bookedCollection = client.db('bikes').collection('bookedItem')
        const usersCollection = client.db('bikes').collection('users')
        const paymentsCollection = client.db('bikes').collection('payments')
        const addsCollection = client.db('bikes').collection('adds')
        const reportCollection = client.db('bikes').collection('reports')

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await bikesCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/items', async (req, res) => {
            const query = {}
            const result = await itemsCollection.find(query).toArray()
            res.send(result)
        })

        //api  for admin , buyer , seller profile Startttttttttttttttttttttttt...................................... 

        app.get('/users', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await usersCollection.find(query).toArray()
            res.send(result)

        })
        //api  for admin , buyer , seller profile  ENDDDDDDDDDDDDDDDDDDDDDDDD...................................... 
        //  |
        //  |

        // verification by admin ..STARTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT...+++++++++++++++++++++++++++


        app.get('/users', async (req, res) => {
            const email = req.query.email
            const role = req.body.status 
            const query = { email: email };
            const updatedDoc = {
                $set: {
                    role :role
                }
            }
            const result = await usersCollection.updateOne(query,updatedDoc);
            res.send(result)
        })



        // app.put('users/admin/:id', async (req, res) => {
        //     const id = req.params.id ;
        //     const filter = {_id: ObjectId(id)} 
        //     const options = {upsert : true};
        //     const updatedDoc= {
        //         $set: {
        //             role: 'admin'
        //         }
        //     }
        //     const result = await usersCollection.updateOne(filter, updatedDoc, options)
        //     res.send(result)
        // })

 // verification by admin ..ENDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...+++++++++++++++++++++++++++

        //items add api ......

        app.post('/items', async (req, res) => {
            const item = req.body
            console.log(item)
            const result = await itemsCollection.insertOne(item)
            res.send(result)
        })


        app.get('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { categoryId: id };
            const result = await itemsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookedItem', async (req, res) => {
            const booking = req.body

            const query = { productName: booking.productName }
            const alreadyBooked = await bookedCollection.find(query).toArray()
            console.log(alreadyBooked)
            if (alreadyBooked.length) {
                const message = `This item is Already booked`
                return res.send({ acknowledged: false, message })
            }
            const result = await bookedCollection.insertOne(booking)
            res.send(result)
        })

// payment api ++++++++++++++++++++++++++++++++++++++++

        app.get('/bookedItem/:id', async (req, res) => {
            const id =req.params.id;
            const query = {_id: ObjectId(id)};
            const booked = await bookedCollection.findOne(query);
            res.send(booked)
        })

    app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

        const paymentIntent = await stripe.paymentIntents.create({
                 currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
             });
             console.log(paymentIntent.client_secret)
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedPayment = await bookedCollection.updateOne(filter, updatedDoc)
            res.send(result);
         })

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        //  ,
        app.get('/bookedItem',verifyJWT , async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
         const query = { email: email };
            console.log(req.headers.authorization)
            const result = await bookedCollection.find(query).toArray()
            res.send(result)
        })

        // jwt token-------------set up start

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            // res.send({accessToken : 'accessToken'})
             res.status(403).send({ accessToken: 'No token' })
        })
        // jwt token-------------set up end

        app.get('/dashboard/items', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await itemsCollection.find(query).toArray()
            res.send(result)
        })

        // api for delete operation in seller add items delete profile startttttttttttttttttttttttttttttt----------------------

        app.delete('/dashboard/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemsCollection.deleteOne(query);
            res.send(result)
        })

        app.get('/dashboard/items/:id', async (req, res) => {
            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await itemsCollection.findOne(query);
            res.send(result)
        })

        // api for delete operation in seller profile ENDDDDDDDDDDDDDDDDDDDDDDDD--------------------------------------


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result);
        })

        

        app.get('/users/allSellers', async (req, res) => {

            const query = {};
            const users = await usersCollection.find(query).toArray();

            const sellers = users.filter(user => user.role === 'seller')
            res.send(sellers);
        })
        // api for admin's delete operation for all seller  Starttttttttttttttttttttttttttttttttt=============================

        app.get('/users/allSellers/:id', async (req, res) => {

            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)

        })

        app.delete('/users/allSellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        // api for admin's delete operation for allUsers  ENDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=============================


        app.get('/users/allBuyers', async (req, res) => {

            const query = {};
            const users = await usersCollection.find(query).toArray();

            const sellers = users.filter(user => user.role === 'buyer')
            res.send(sellers);
        })

        // api for admin's delete operation for buyers  Starttttttttttttttttttttttttttttttttt=============================

        app.get('/users/allBuyers/:id', async (req, res) => {

            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)

        })

        app.delete('/users/allBuyers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        // api for admin's delete operation for all buyers  ENDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=============================

        // adds api TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT=======================

        app.post('/adds', async (req, res) => {
            const user = req.body;
            const result = await addsCollection.insertOne(user)
            res.send(result);
        })

        app.get('/adds', async (req, res) => {
            const query = {};
            const result = await addsCollection.find(query).toArray()
            res.send(result);
        })


        // report =================================================
        app.get('/reportByAdmin', async (req, res) => {
            const query = {};
            const result = await reportCollection.find(query).toArray()
            res.send(result);
        })

        app.post('/report', async (req, res) => {
            const user = req.body;
            const result = await reportCollection.insertOne(user)
            res.send(result);
        })
        app.delete('/dashboard/reportAdmin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reportCollection.deleteOne(query);
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(err => console.error(err))

app.get('/', (req, res) => {
    res.send('bike is riding')
})

app.listen(port, () => {
    console.log(`bike is running ${port}`)
})
