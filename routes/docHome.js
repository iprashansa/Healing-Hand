const express = require('express');
const router = express.Router();
const Doctor = require('../models/docRegister');
const Patient = require('../models/patientRegister');

router.get('/', (req, res) => {
    // Check if the doctor is logged in
    // if (!req.session.doctor) {
    //     // Redirect to login page if doctor is not logged in
    //     return res.redirect('/doctor/doctorSignUp');
    // }

    // Render doctor home page with doctor's information
    res.render('docHome', { doctor: req.session.doctor });
});

// Route to show scheduled appointments for the logged-in doctor
router.get('/appointments', async (req, res) => {
    try {
        // Ensure doctor is logged in
        if (!req.session.doctor) {
            return res.redirect('/doctor/doctorSignUp');
        }
        // Fetch the latest doctor data from DB (in case of updates)
        const doctor = await Doctor.findById(req.session.doctor._id).lean();
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
router.post('/appointments/:appointmentId/done', async (req, res) => {
    try {
        if (!req.session.doctor) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const doctor = await Doctor.findById(req.session.doctor._id);
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
