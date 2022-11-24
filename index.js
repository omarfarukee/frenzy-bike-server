const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
// const jwt = require('jsonwebtoken')
require('dotenv').config()

//middle ware
app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
    res.send('bike is riding')
})

app.listen(port,() => {
    console.log(`bike is running ${port}`)
})
