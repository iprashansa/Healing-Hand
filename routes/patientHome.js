const express = require('express');
const router = express.Router();
const { requirePatientAuth } = require('./patientSignUp');
const Doctor = require('../models/docRegister');
const Patient = require('../models/patientRegister');

// router.get('/', (req, res) => {
//     res.render('patientHome',{patient: req.session.patient});
// });

router.get('/', requirePatientAuth, async (req, res) => {
    const patient = await Patient.findById(req.user.userId);
    if (!patient) return res.status(404).send('Patient not found');
    res.render('patientHome', { patient });
});

module.exports = router;
