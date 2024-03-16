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
        res.redirect("/patient/patientHome");
    } catch (error) {
        res.status(400).send(error.message);
    }
   
})

module.exports = router;
