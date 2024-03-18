const express = require('express');
const router = express.Router();
const PatientMedicalRecords = require("../models/patientRecords");
const  {validationResult } = require('express-validator');
const PatientRegister = require('../models/patientRegister');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};



router.get("/",function(req,res){
    res.render('medical_records')
})

router.post('/',async function(req,res){
try {
    const {height,weight,BMI,bloodReport,insurance,insuranceFile,married,consanguineous,diet,smoking,drinking,pastDiseases,pastDiseasesReport,familyMedicalCondition,presentMedicalCondition,medicalSymptoms,presentMedicalReport} = req.body;

    const patient = await PatientRegister.findOne({email:req.session.id})
    if (!patient) {
        return res.status(404).send("Patient not found");
    }
    const newPatientRecords = new PatientMedicalRecords({height,weight,BMI,bloodReport,insurance,insuranceFile,married,consanguineous,diet,smoking,drinking,pastDiseases,pastDiseasesReport,familyMedicalCondition,presentMedicalCondition,medicalSymptoms,presentMedicalReport});
        await newPatientRecords.save();
        res.redirect("/patient/records");
    } catch (error) {
        res.status(400).send(error.message);
    }
    
})


module.exports = router;