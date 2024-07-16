const express = require('express');
const router = express.Router();
const Doctor = require('../models/docRegister');
const Patient = require('../models/patientRegister');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find(); // Fetch all doctors from the database
        res.render('appointments', { doctors }); // Render the appointment.ejs view with the list of doctors
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:doctorId', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId);
        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }
        res.render('doctorDetail', { doctor }); // Render the doctorDetail.ejs view with doctor details
    } catch (err) {
        console.error('Error fetching doctor:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/bookSlot', async (req, res) => {
    const { doctorId, date, time } = req.body;

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).send({ success: false, message: 'Doctor not found' });
        }

        const slot = doctor.availableSlots.find(slot => slot.date === date && slot.startTime === time);
        if (!slot || !slot.isAvailable) {
            return res.status(400).send({ success: false, message: 'Slot not available' });
        }

        slot.isAvailable = false; // Mark slot as booked

        const newAppointment = {
            patientId: req.session.userId,
            date: date,
            startTime: slot.startTime, // Use startTime from slotToBook
            endTime: slot.endTime // Use endTime from slotToBook
        };
        doctor.appointments.push(newAppointment);
        
        const patient = await Patient.findById(req.session.userId);
        if (!patient) {
            return res.status(404).send({ success: false, message: 'Patient not found' });
        }

        const patientAppointment = {
            doctorId: doctor._id,
            date: date,
            startTime: slot.startTime,
            endTime: slot.endTime
        };
        patient.bookedAppointments.push(patientAppointment);

        await doctor.save();
        await patient.save();
        res.send({ success: true });
    } catch (err) {
        console.error('Error booking slot:', err);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
