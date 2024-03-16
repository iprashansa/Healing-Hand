const mongoose = require("mongoose");

const MedicalRecordsSchema = new mongoose.Schema({

    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    BMI: {
        type: Number,
        required: true
    },
    bloodReport: {
        type: String,
        required: true
    },
    insurance:{
        type:Boolean,
        required:true
    },
    insuranceFile: {
        type: String, 
        required: true
    },
    married: {
        type: Boolean,
        required: true
    },
    consanguineous: {
        type: Boolean,
        required: true
    },
    diet: {
        type: String,
        enum: ['Veg', 'Non Veg'], 
        required: true
    },
    smoking: {
        type: Boolean,
        required: true
    },
    drinking: {
        type: Boolean,
        required: true
    },
    pastDiseases: {
        type: String,
        required: true
    },
    pastDiseasesReport: {
        type: String, 
        required: true
    },
    familyMedicalCondition: {
        type: String,
        required: true
    },
    presentMedicalCondition: {
        type: String,
        required: true
    },
    medicalSymptoms: {
        type: String,
        required: true
    },
    presentMedicalReport: {
        type: String, 
        required: true
    }
});

const PatientMedicalRecords = mongoose.model("PatientMedicalRecords", MedicalRecordsSchema);
module.exports = PatientMedicalRecords;