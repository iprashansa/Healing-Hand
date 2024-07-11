const express = require('express');
const router = express.Router();

// router.get('/', (req, res) => {
//     res.render('patientHome',{patient: req.session.patient});
// });

router.get('/', (req, res) => {
    // Check if the patient is logged in
    if (req.session.patient) {
        res.render('patientHome', { patient: req.session.patient });
    } else {
        // Redirect to login page or handle unauthorized access
        res.redirect('/patient/login'); // Redirect to the login page if not logged in
    }
});

module.exports = router;
