const express = require('express');
const router = express.Router();

router.get('/doctorSignUp', (req, res) => {
  
    res.render('docs_register');
});

module.exports = router;
