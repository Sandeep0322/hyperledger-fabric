const express = require('express')
const app = express();
const PORT = process.env.PORT || 3000;
const router = require('./src/router')
const cors = require('cors');
const mongoose = require('mongoose');
const uri = "";

app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: '*'
}))
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


mongoose.set("strictQuery",false)
mongoose.connect(uri).then(() => {
    app.listen(PORT,() =>{
        console.log(`App listening on port ${PORT}`)
    })
    console.log("connected to MongoDB");
}).catch((error) => {
    console.log(error)
})