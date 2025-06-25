// Inside doctorRoutes.js or equivalent
const express = require('express');
const router = express.Router();
const DoctorModel = require('../models/docRegister'); // Adjust the path as per your file structure
const { requireDoctorAuth } = require('./doctorSignUp');

// Route to render doctor profile page
router.get('/doctorProfile', requireDoctorAuth, (req, res) => {
    res.render('doctorProfile', { doctor: req.user });
});

router.post('/updateProfile', requireDoctorAuth, async (req, res) => {
    try {
        const { name, speciality, contact, location } = req.body;
        
        // Update profile logic using Mongoose or other ORM
        const doctor = await DoctorModel.findByIdAndUpdate(req.user.userId, {
            name,
            speciality,
            contact,
            location
        }, { new: true });

        if (!doctor) {
            return res.status(404).send('Doctor not found'); // Handle case where doctor is not found
        }
        // No session update needed with JWT
        res.redirect('/doctor/docHome'); // Redirect after successful update
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});

module.exports = router;
