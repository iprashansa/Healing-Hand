const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const PatientRegister = require("../models/patientRegister");

router.get('/patientSignUp', (req, res) => {

    res.render('patient_register');
});

router.post("/patientSignUp",async function(req,res){
    try {
        const {name,email,phoneNumber,password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPatient = new PatientRegister({name,email,phoneNumber,password:hashedPassword});
        await newPatient.save();
        req.session.patient=newPatient;
        req.session.userId=newPatient._id;
        res.redirect("/patient/patientHome");
    } catch (error) {
        res.status(400).send(error.message);
    }
   
})

router.post('/login', async function(req, res) {
    try {
        const { email, password } = req.body;

        const patient = await PatientRegister.findOne({ email });

        if (!patient) {
            // If patient not found, return an error
            console.log('Invalid credentials');
            return res.status(400).send('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        if (!isPasswordValid) {
            // If password doesn't match, return an error
            console.log('Invalid credentials');
            return res.status(400).send('Invalid credentials');
        }
        req.session.patient=patient;
        req.session.userId=patient._id;
        console.log('Login successful');
        res.redirect('/patient/patientHome');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send(error.message);
    }
});


router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Logout successful');
            res.redirect('/'); // Redirect to home page
        }
    });
});

module.exports = router;
