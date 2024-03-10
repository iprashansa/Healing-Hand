const express = require('express');
const router = express.Router();

router.get('/patientSignUp', (req, res) => {

    res.render('patient_register');
});

module.exports = router;
