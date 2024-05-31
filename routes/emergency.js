const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  
    res.render('emergency');
});

module.exports = router;
