const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const mainPage = require('./routes/index');
const doctorRoutes = require('./routes/doctorSignUp');
const patientRoutes = require('./routes/patientSignUp');
const patientHome = require('./routes/patientHome');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost/healingHandDB");



app.use('/',mainPage);
app.use('/', doctorRoutes);
app.use('/', patientRoutes);
app.use('/',patientHome);

 app.listen(3000,function(){
    console.log("server is running so beautifully");

 })