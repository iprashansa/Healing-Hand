const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const OpenAI = require('openai');


const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
const openai = new OpenAI({ apiKey: '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' });
mongoose.connect("mongodb://localhost/healingHandDB");



const mainPage = require('./routes/index');
const doctorRoutes = require('./routes/doctorSignUp');
const patientRoutes = require('./routes/patientSignUp');
const patientHome = require('./routes/patientHome');
const docHome = require('./routes/docHome');
const patientProfile = require('./routes/patientProfile')
const healbot = require('./routes/healbot');


app.use('/',mainPage);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/patient/patientHome',patientHome);
app.use('/doctor/docHome',docHome);
app.use('/patient/profile',patientProfile);
app.use('/patient/healbot',healbot);



 app.listen(3000,function(){
    console.log("server is running so beautifully");

 })