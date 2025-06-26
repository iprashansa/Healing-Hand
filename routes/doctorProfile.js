// Inside doctorRoutes.js or equivalent
const express = require('express');
const router = express.Router();
const DoctorModel = require('../models/docRegister'); // Adjust the path as per your file structure
const { requireDoctorAuth } = require('./doctorSignUp');

// Route to render doctor profile page
router.get('/doctorProfile', requireDoctorAuth, async (req, res) => {
    const doctor = await DoctorModel.findById(req.user.userId);
    if (!doctor) return res.status(404).send('Doctor not found');
    res.render('doctorProfile', { doctor });
});

router.post('/updateProfile', requireDoctorAuth, async (req, res) => {
    try {
        const {
            name,
            speciality,
            contact,
            location,
            gender,
            dob,
            experience,
            qualifications,
            languages,
            consultationFee,
            bio
        } = req.body;

        // Parse qualifications and languages as arrays
        const qualificationsArr = qualifications ? qualifications.split(',').map(q => q.trim()).filter(q => q) : [];
        const languagesArr = languages ? languages.split(',').map(l => l.trim()).filter(l => l) : [];

        const updateFields = {
            name,
            speciality,
            phoneNumber: contact,
            location,
            gender,
            dob: dob ? new Date(dob) : undefined,
            experience: experience ? Number(experience) : undefined,
            qualifications: qualificationsArr,
            languages: languagesArr,
            consultationFee: consultationFee ? Number(consultationFee) : undefined,
            bio
        };
        // Remove undefined fields
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const doctor = await DoctorModel.findByIdAndUpdate(req.user.userId, updateFields, { new: true });

        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }
        res.redirect('/doctor/docHome');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});

module.exports = router;
