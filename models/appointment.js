const mongoose = require('mongoose');

const appointmentsSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    specialty:{
        type:String,
        required:true,
        unique:true
    },

    contact:{
        type:Number,
        required:true,
        unique:true
    },

    location:{
        type:String,
        required:true,
        unique:true
    },
    // PatientMedicalRecords:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'PatientMedicalRecords'
    // }
});

const Appointments = mongoose.model("Appointments",appointmentsSchema);
module.exports = Appointments;

