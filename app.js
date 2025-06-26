const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
mongoose.connect('mongodb://localhost/healingHandDB');

const mainPage = require('./routes/index');
const { router: doctorRoutes } = require('./routes/doctorSignUp');
const { router: patientRoutes } = require('./routes/patientSignUp');
const patientHome = require('./routes/patientHome');
const docHome = require('./routes/docHome');
const patientProfile = require('./routes/patientProfile')
//const doctorProfile = require('./routes/doctorProfile')
const patientBlog = require('./routes/patientBlog')
const patientHealbot = require('./routes/healbot');
const patientRecords = require('./routes/patientRecords');
const doctorProfileRouter = require('./routes/doctorProfile');
const patientEmergency = require('./routes/emergency');
const patientAppointments = require('./routes/patientAppointments');

const appointments = require('./routes/appointments');

app.use('/',mainPage);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/patient/patientHome',patientHome);
app.use('/doctor/docHome',docHome);
app.use('/patient/profile',patientProfile);
app.use('/patient/blog',patientBlog);
app.use('/',patientHealbot);
app.use('/patient/records',patientRecords);
app.use('/doctor/docHome', doctorProfileRouter);
app.use('/patient/emergency',patientEmergency);
app.use('/patient', patientAppointments);

app.use('/patient/appointments',appointments);

//app.use('/doctor/profile',doctorProfile);

app.get('/api-key', (req, res) => {
   res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

 app.listen(3000,function(){
    console.log("server is running so beautifully");

 })