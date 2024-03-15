const express = require('express');
const router = express.Router();


router.get("/",function(req,res){
    res.render('medical_records')
})


module.exports = router;