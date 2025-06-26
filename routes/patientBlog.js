const express = require('express');
const router = express.Router();
const { requirePatientAuth } = require('./patientSignUp');
const PatientRegister = require('../models/patientRegister');

router.get('/', requirePatientAuth, async (req, res) => {
    const patient = await PatientRegister.findById(req.user.userId);
    if (!patient) return res.status(404).send('Patient not found');
    res.render('patientBlog', { patient });
});

module.exports = router;