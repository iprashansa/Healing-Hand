const express = require('express');
const router = express.Router();
const { requirePatientAuth } = require('./patientSignUp');

// router.get('/', (req, res) => {
//     res.render('patientHome',{patient: req.session.patient});
// });

router.get('/', requirePatientAuth, (req, res) => {
    res.render('patientHome', { patient: req.user });
});

module.exports = router;
