const express = require('express');
const router = express.Router();
const { requirePatientAuth } = require('./patientSignUp');
const Doctor = require('../models/docRegister');
const Patient = require('../models/patientRegister');

router.get('/bookedAppointments', requirePatientAuth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.userId);
        if (!patient) return res.status(404).send('Patient not found');
        // For each booked appointment, get doctor info and status
        const appointments = await Promise.all(
            patient.bookedAppointments.map(async (appt) => {
                const doctor = await Doctor.findById(appt.doctorId);
                // Find the matching appointment in doctor's appointments to get status
                let status = 'pending';
                if (doctor) {
                    const docAppt = doctor.appointments.find(a => a.patientId.toString() === patient._id.toString() && a.date === appt.date && a.startTime === appt.startTime && a.endTime === appt.endTime);
                    if (docAppt) status = docAppt.status;
                }
                return {
                    doctor: doctor ? {
                        name: doctor.name,
                        speciality: doctor.speciality,
                        location: doctor.location,
                        phoneNumber: doctor.phoneNumber,
                        email: doctor.email
                    } : {},
                    date: appt.date,
                    startTime: appt.startTime,
                    endTime: appt.endTime,
                    status
                };
            })
        );
        // Sort by date, then by startTime (descending)
        appointments.sort((a, b) => {
            if (a.date === b.date) {
                return b.startTime.localeCompare(a.startTime);
            }
            return new Date(b.date) - new Date(a.date);
        });
        res.render('patientBookedAppointments', { appointments });
    } catch (err) {
        console.error('Error fetching booked appointments:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router; 