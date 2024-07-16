const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
});

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
    bookedAppointments: {
        type: [appointmentSchema],
        default: []
    },
    // PatientMedicalRecords:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'PatientMedicalRecords'
    // }
});

const PatientRegister = mongoose.model("PatientRegister",patientRegisterSchema);
module.exports = PatientRegister;

