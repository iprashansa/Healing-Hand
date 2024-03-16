const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost/healingHandDB");



const mainPage = require('./routes/index');
const doctorRoutes = require('./routes/doctorSignUp');
const patientRoutes = require('./routes/patientSignUp');
const patientHome = require('./routes/patientHome');
const docHome = require('./routes/docHome');
const patientProfile = require('./routes/patientProfile')
const patientBlog = require('./routes/patientBlog')
const patientHealbot = require('./routes/healbot');
const patientRecords = require('./routes/patientRecords');


app.use('/',mainPage);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/patient/patientHome',patientHome);
app.use('/doctor/docHome',docHome);
app.use('/patient/profile',patientProfile);
app.use('/patient/blog',patientBlog);
app.use('/',patientHealbot);
app.use('/patient/records',patientRecords);



 app.listen(3000,function(){
    console.log("server is running so beautifully");

 })