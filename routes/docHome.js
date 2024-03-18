const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // Check if the doctor is logged in
    // if (!req.session.doctor) {
    //     // Redirect to login page if doctor is not logged in
    //     return res.redirect('/doctor/doctorSignUp');
    // }

    // Render doctor home page with doctor's information
    res.render('docHome', { doctor: req.session.doctor });
});

module.exports = router;
