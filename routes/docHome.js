const express = require('express');
const router = express.Router();
const Doctor = require('../models/docRegister');
const Patient = require('../models/patientRegister');
const { requireDoctorAuth } = require('./doctorSignUp');

router.get('/', requireDoctorAuth, async (req, res) => {
    const doctor = await Doctor.findById(req.user.userId);
    if (!doctor) return res.status(404).send('Doctor not found');
    res.render('docHome', { doctor });
});

// Route to show scheduled appointments for the logged-in doctor
router.get('/appointments', requireDoctorAuth, async (req, res) => {
    try {
        // Fetch the latest doctor data from DB (in case of updates)
        const doctor = await Doctor.findById(req.user.userId).lean();
        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }
        // Populate patient details for each appointment
        let appointmentsWithPatients = await Promise.all(
            (doctor.appointments || []).map(async (appt) => {
                const patient = await Patient.findById(appt.patientId).lean();
                return {
                    ...appt,
                    patient: patient ? { name: patient.name, email: patient.email, phoneNumber: patient.phoneNumber } : null
                };
            })
        );
        // Sort: pending (or missing status) first (by date/startTime), then done (by date/startTime)
        appointmentsWithPatients = appointmentsWithPatients.sort((a, b) => {
            const statusA = a.status || 'pending';
            const statusB = b.status || 'pending';
            if (statusA === statusB) {
                // Compare by date then startTime
                const dateA = new Date(a.date + 'T' + a.startTime);
                const dateB = new Date(b.date + 'T' + b.startTime);
                return dateA - dateB;
            }
            // Pending (or missing) first
            return statusA === 'pending' ? -1 : 1;
        });
        res.render('doctorAppointments', { doctor, appointments: appointmentsWithPatients });
    } catch (err) {
        console.error('Error fetching scheduled appointments:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to mark an appointment as done
router.post('/appointments/:appointmentId/done', requireDoctorAuth, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.userId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const appointment = doctor.appointments.id(req.params.appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'done';
        await doctor.save();
        return res.json({ success: true });
    } catch (err) {
        console.error('Error marking appointment as done:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
