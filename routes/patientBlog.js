const express = require('express');
const router = express.Router();
const { requirePatientAuth } = require('./patientSignUp');

router.get('/', requirePatientAuth, (req, res) => {
    res.render('patientBlog', { patient: req.user });
});

module.exports = router;