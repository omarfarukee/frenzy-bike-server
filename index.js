const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

const jwt = require('jsonwebtoken')
require('dotenv').config()

app.use(cors())
app.use(express.json())


function verifyJWT(req, res, next) {
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
            const result = await bookedCollection.insertOne(booking)
            res.send(result)
        })
        // verifyJWT
        app.get('/bookedItem', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
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
            // console.log(user)
            res.status(403).send({ accessToken: 'No token' })
        })
        // jwt token-------------set up end

        app.get('/dashBoard/items', async (req, res) => {
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
        app.get('/users/allBuyers', async (req, res) => {

            const query = {};
            const users = await usersCollection.find(query).toArray();

            const sellers = users.filter(user => user.role === 'buyer')
            res.send(sellers);
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
