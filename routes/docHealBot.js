const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const path = require('path');

const openai = new OpenAI({ apiKey: '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' });
router.get('/', (req , res) => {
    res.render('docHealBot');
});


router.post('/', async (req, res) => {
    try {
        const { messages } = req.body;

        // it is used to generate response
        const completion = await openai.chat.completions.create({
            messages,
            model: "gpt-3.5-turbo",
        });
        //used to Send the generated response 
        res.json({ response: completion.choices[0].message.content });
        //
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// User side JavaScript 
router.get('/healbot.js', (req, res) => {
    res.sendFile(__dirname +'/public/healbot.js');
});


module.exports = router;