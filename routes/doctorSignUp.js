const express = require('express');
const router = express.Router();
const DocRegister = require("../models/docRegister");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const COOKIE_OPTIONS = { httpOnly: true, secure: false, sameSite: 'lax' };

router.get('/doctor/docHome', requireDoctorAuth, (req, res) => {
    res.render('docHome', { doctor: req.user });
});

router.get('/doctorSignUp', (req, res) => {
    res.render('docs_register');
});

router.post('/doctorSignUp', async function(req, res) {
    try {
        const {name, docId, email, phoneNumber, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDoc = new DocRegister({name, docId, email, phoneNumber, password: hashedPassword});
        await newDoc.save();
        // Generate JWT
        const token = jwt.sign({ userId: newDoc._id, name: newDoc.name, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        res.redirect('/doctor/docHome');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/login', async function(req, res) {
    try {
        const { email, password } = req.body;
        const doctor = await DocRegister.findOne({ email });
        if (!doctor) {
            return res.status(400).send('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        if (!isPasswordValid) {
            return res.status(400).send('Invalid credentials');
        }
        // Generate JWT
        const token = jwt.sign({ userId: doctor._id, name: doctor.name, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        res.redirect('/doctor/docHome');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

function requireDoctorAuth(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/doctor/doctorSignUp');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/doctor/doctorSignUp');
    }
}

router.get('/logout', function(req, res) {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = { router, requireDoctorAuth };
