const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

 const jwt = require('jsonwebtoken')
require('dotenv').config()

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xdpsuxi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{

        const bikesCollection = client.db('bikes').collection('bikeCategory')
        const itemsCollection = client.db('bikes').collection('items')
        const bookedCollection = client.db('bikes').collection('bookedItem')
        const usersCollection = client.db('bikes').collection('users')

        app.get('/categories', async(req, res) =>{   
            const query ={}
            const result =await bikesCollection.find(query).toArray();
             res.send(result)
        })

        app.get('/items', async( req, res) => {
            const query = {}
            const result = await itemsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { categoryId : id };
            const result = await itemsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookedItem', async(req, res) => {
            const booking = req.body
            const result = await bookedCollection.insertOne(booking)
            res.send(result)
        })

        app.get('/bookedItem', async( req,res) =>{
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = {email: email};
            // console.log(req.headers.authorization)
            const result =  await bookedCollection.find(query).toArray()
            res.send(result)
        })

        // jwt token-------------

        app.get('/jwt', async(req, res) => {
            const email = req.query.email; 
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'})
            }
            console.log(user)
            res.send({accessToken: 'token'})
        })

        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result);
        })
    

    } 
    finally{

    }
}
run().catch(err => console.error(err))

app.get('/', (req, res)=>{
    res.send('bike is riding')
})

app.listen(port,() => {
    console.log(`bike is running ${port}`)
})
