const express = require('express');
const router = express.Router();
const PatientRegister = require("../models/patientRegister");

router.get('/patientSignUp', (req, res) => {

    res.render('patient_register');
});

router.post("/patientHome",async function(req,res){
    try {
        const {name,email,phoneNumber,password} = req.body;
        const newPatient = new PatientRegister({name,email,phoneNumber,password});
        await newPatient.save();
        res.redirect("/patientHome");
    } catch (error) {
        res.status(400).send(error.message);
    }
    
   
})

module.exports = router;
