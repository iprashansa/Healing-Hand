const mongoose = require('mongoose');

const patientRegisterSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    phoneNumber:{
        type:Number,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true,
        unique:true
    },
    // PatientMedicalRecords:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'PatientMedicalRecords'
    // }
});

const PatientRegister = mongoose.model("PatientRegister",patientRegisterSchema);
module.exports = PatientRegister;

