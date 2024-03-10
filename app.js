const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost/healingHandDB");


const doctorRoutes = require('./routes/doctorSignUp');
const patientRoutes = require('./routes/patientSignUp');
const mainPage = require('./routes/index')

app.use('/',mainPage);
app.use('/', doctorRoutes);
app.use('/', patientRoutes);

 app.listen(3000,function(){
    console.log("server is running so beautifully");

 })