const express = require('express');
const router = express.Router();
const DocRegister = require("../models/docRegister");
const bcrypt = require('bcrypt');

router.get('/doctorSignUp', (req, res) => {
    res.render('docs_register');
});

router.post('/doctorSignUp', async function(req, res) {
    try {
        const {name, docId, email, phoneNumber, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDoc = new DocRegister({name, docId, email, phoneNumber, password: hashedPassword});

        await newDoc.save();
        res.redirect('/doctor/docHome'); // Update the redirection path
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/login', async function(req, res) {
    try {
        const { email, password } = req.body;

        const doctor = await DocRegister.findOne({ email });

        if (!doctor) {
            // If doctor not found, return an error
            console.log('Invalid credentials');
            return res.status(400).send('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        if (!isPasswordValid) {
            // If password doesn't match, return an error
            console.log('Invalid credentials');
            return res.status(400).send('Invalid credentials');
        }
        req.session.doctor = doctor;
        console.log('Login successful');
        res.redirect('/doctor/docHome');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send(error.message);
    }
});

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Logout successful');
            res.redirect('/'); // Redirect to home page
        }
    });
});


module.exports = router;
