const express = require('express');
const router = express.Router();

router.get('/patientHome', (req, res) => {
  
    res.render('patientHome');
});

module.exports = router;
