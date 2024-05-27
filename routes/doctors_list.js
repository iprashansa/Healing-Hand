const express = require('express');
const router = express.Router();
const DoctorDetails = require('../models/doctorDetails');
const Appointments = require('../models/appointment');

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

router.post('/appointments',async(req,res)=>{
    const {name,speciality,contact,location} = req.body;
    const newAppointments = new Appointments({name,speciality,contact,location});
    await newAppointments.save();
})

module.exports = router;
