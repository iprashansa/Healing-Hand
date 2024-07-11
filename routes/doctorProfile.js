// Inside doctorRoutes.js or equivalent
const express = require('express');
const router = express.Router();
const DoctorModel = require('../models/docRegister'); // Adjust the path as per your file structure

// Route to render doctor profile page
router.get('/doctorProfile', (req, res) => {
    // Fetch doctor's information from session or database if needed
    const doctor = req.session.doctor; // Assuming doctor data is stored in session
    res.render('doctorProfile', { doctor });
});

router.post('/updateProfile', async (req, res) => {
    try {
        const { name, speciality, contact, location } = req.body;
        
        // Update profile logic using Mongoose or other ORM
        const doctor = await DoctorModel.findByIdAndUpdate(req.session.doctor._id, {
            name,
            speciality,
            contact,
            location
        }, { new: true });

        if (!doctor) {
            return res.status(404).send('Doctor not found'); // Handle case where doctor is not found
        }
        req.session.doctor = doctor;
        res.redirect('/doctor/docHome'); // Redirect after successful update
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});



module.exports = router;
