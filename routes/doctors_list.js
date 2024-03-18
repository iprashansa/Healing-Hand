const express = require('express');
const router = express.Router();
const DoctorDetails = require('../models/doctorDetails');

router.get('/appointments', async (req, res) => {
    try {
        // Fetch all doctor details from the database
        const allDoctors = await DoctorDetails.find().populate('doctor');
        console.log('Fetched Doctors:', allDoctors);
        // Render a page with the fetched doctor details
        res.render('doctors_list', { allDoctors });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
