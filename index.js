const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
// const jwt = require('jsonwebtoken')
require('dotenv').config()

//middle ware
app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xdpsuxi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{

        const bikesCollection = client.db('bikes').collection('bikeCategory')

        app.get('/categories', async(req, res) =>{   
            const query ={}
            const result =await bikesCollection.find(query).toArray();
             res.send(result)
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
