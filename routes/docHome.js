const express = require('express');
const router = express.Router();

router.get('/docHome', (req, res) => {
  
    res.render('docHome');
});

module.exports = router;
