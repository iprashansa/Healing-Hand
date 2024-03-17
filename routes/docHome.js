const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  
    res.render('docHome', { doctorName: req.session.doctorName });

});

module.exports = router;
