/** ------------------ IMPORTING PACKAGE ------------------ **/
const express = require('express');
const port = 8000;
const app = express();
const path = require('path');

const expressLayouts = require('express-ejs-layouts');
const csv = require('csv-parser');
const db = require("./config/mongoose");
const bodyParser = require('body-parser');

// setting layouts
app.use(expressLayouts);

// middleware for body-parser
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

// setting up routes
app.use('/', require('./routes'));
 
app.get("/", (req,res) =>{
    res.send("hello786");
})

// directing the app in the given port 
app.listen(port, function(err) {
    if(err) {
        console.log('Error', err);
        return;
    }
    console.log('Server is up and running on port: ', port);

});