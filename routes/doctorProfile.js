const express = require('express');
const router = express.Router();

router.get('/doctorDetails', (req, res) => {
    const doctor = {
        name: 'Doctor Name',
        speciality: 'Doctor Speciality',
        contact: 'Doctor Contact',
        location: 'Doctor Location'
        // Add more details 
    };

    res.render('doctorProfile', { doctor: doctor });
});

module.exports = router;
