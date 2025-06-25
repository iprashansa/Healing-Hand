const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PatientRegister = require("../models/patientRegister");

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const COOKIE_OPTIONS = { httpOnly: true, secure: false, sameSite: 'lax' };

router.get('/patientSignUp', (req, res) => {
    res.render('patient_register');
});

router.post("/patientSignUp",async function(req,res){
    try {
        const {name,email,phoneNumber,password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPatient = new PatientRegister({name,email,phoneNumber,password:hashedPassword});
        await newPatient.save();
        // Generate JWT
        const token = jwt.sign({ userId: newPatient._id, name: newPatient.name, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        res.redirect("/patient/patientHome");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/login', async function(req, res) {
    try {
        const { email, password } = req.body;
        const patient = await PatientRegister.findOne({ email });
        if (!patient) {
            return res.status(400).send('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        if (!isPasswordValid) {
            return res.status(400).send('Invalid credentials');
        }
        // Generate JWT
        const token = jwt.sign({ userId: patient._id, name: patient.name, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        res.redirect('/patient/patientHome');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// JWT middleware for patient routes
function requirePatientAuth(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/patient/patientSignUp');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/patient/patientSignUp');
    }
}

router.get('/logout', function(req, res) {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = { router, requirePatientAuth };
