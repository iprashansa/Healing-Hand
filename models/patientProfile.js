const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    bloodGroup:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    number:{
        type:Number,
        required:true,
        unique:true
    },

    address:{
        type:String,
        required:true,
        unique:true
    },
    // PatientMedicalRecords:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'PatientMedicalRecords'
    // }
});

const PatientProfile = mongoose.model("PatientProfile",patientProfileSchema);
module.exports = PatientProfile;

