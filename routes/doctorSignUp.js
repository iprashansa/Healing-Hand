const express = require('express');
const router = express.Router();
const DocRegister = require("../models/docRegister");
router.get('/doctorSignUp', (req, res) => {
  
    res.render('docs_register');
});

router.post('/doctorSignUp',async function(req,res){
    try {
        const {name,docId,email,phoneNumber,password} = req.body;
        const newDoc = new DocRegister({name,docId,email,phoneNumber,password});
        await newDoc.save();
        res.redirect('/doctor/docHome');
    } catch (error) {
        res.status(400).send(error.message);
    }
})

module.exports = router;
