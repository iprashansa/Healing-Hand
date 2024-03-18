const express = require('express');
const router = express.Router();
const DoctorDetails = require("../models/doctorDetails");

// GET route to display doctor details
router.get('/doctorDetails', async (req, res) => {
    try {
        // Fetch doctor details from the database
        const doctorDetails = await DoctorDetails.findOne(); // Assuming you only have one doctor's details

        if (doctorDetails) {
            // Render the doctorProfile view with the fetched details
            res.render('doctorProfile', { doctor: doctorDetails });
        } else {
            // If no doctor details found, render with default dummy doctor details
            const doctor = {
                name: 'Doctor Name',
                speciality: 'Doctor Speciality',
                contact: 'Doctor Contact',
                location: 'Doctor Location'
                // Add more details 
            };
            res.render('doctorProfile', { doctor: doctor });
        }
    } catch (err) {
        console.error("Error fetching doctor details:", err);
        
    }
});


// POST route to save doctor details
router.post('/doctorDetails', async (req, res) => {
    const { name, speciality, contact, location } = req.body;
    try {
        // Check if there are existing doctor details in the database
        let existingDoctorDetails = await DoctorDetails.findOne();

        if (existingDoctorDetails) {
            // If doctor details exist, update them
            existingDoctorDetails.name = name;
            existingDoctorDetails.speciality = speciality;
            existingDoctorDetails.contact = contact;
            existingDoctorDetails.location = location;
            await existingDoctorDetails.save();
        } else {
            // If no existing doctor details found, create new ones
            const newDoctorProfile = new DoctorDetails({ name, speciality, contact, location });
            await newDoctorProfile.save();
        }
        res.redirect("/doctor/docHome/doctorDetails");
    } catch (err) {
        console.error("Error saving/updating doctor details:", err);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = router;
