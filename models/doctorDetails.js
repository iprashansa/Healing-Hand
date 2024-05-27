const mongoose = require('mongoose');

const doctorDetailsSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocRegister',
        required: true
    },
    name: String,
    speciality: String,
    contact: String,
    location: String,
    
    // Add other fields 
});

// Create model for doctor's details
const DoctorDetails = mongoose.model('DoctorDetails', doctorDetailsSchema);

module.exports = DoctorDetails;
