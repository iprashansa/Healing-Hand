const express = require('express');
const router = express.Router();
const PatientProfile = require('../models/patientProfile');
const { requirePatientAuth } = require('./patientSignUp');

router.get('/', requirePatientAuth, (req, res) => {
    res.render('patient_profile', { patient: req.user });
});

router.post('/patient/profile', async (req, res) => {
    try {
      // Create a new patient profile instance with data from the request body
      const newPatientProfile = new PatientProfile({
        name: req.body.name,
        bloodGroup: req.body.bloodGroup,
        age: req.body.age,
        email: req.body.email,
        number: req.body.number,
        address: req.body.address
      });
  
      // Save the new patient profile to the database
      const savedPatientProfile = await newPatientProfile.save();
  
      // Send a success response with the saved patient profile
      res.status(201).json(savedPatientProfile);
    } catch (error) {
      // If there's an error, send a 400 status code with the error message
      res.status(400).json({ message: error.message });
    }
  });

module.exports = router;