require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const OpenAI = require('openai');
const { requirePatientAuth } = require('./patientSignUp');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());
console.log('Loaded OpenAI API Key:', process.env.OPENAI_API_KEY); // Add this line

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get('/', requirePatientAuth, (req, res) => {
    res.render('healbot', { patient: req.user });
});

router.post('/patient/healbot', async (req, res) => {
    try {
        const { messages } = req.body;
        console.log('Received messages:', messages);

        // Generate response
        const completion = await openai.chat.completions.create({
            messages,
            model: "gpt-3.5-turbo",
        });

        // Send the generated response
        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
