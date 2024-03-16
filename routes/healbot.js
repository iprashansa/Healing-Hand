const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const OpenAI = require('openai');

router.use(bodyParser.urlencoded({extended:true}));
const openai = new OpenAI({ apiKey: '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' });
router.get('/patient/healbot', (req , res) => {
    res.render('healbot');
});


router.post('/patient/healbot', async (req, res) => {
    try {
        const { messages } = req.body;
        console.log('Received messages:', messages);
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



module.exports = router;