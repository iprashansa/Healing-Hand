const mongoose = require('mongoose');


const docRegisterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    docId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
            return /^2022\d{4}$/.test(value);

        },
            message: props => `${props.value} is not a valid docId! Must start with 2022 and be 8 digits long.`
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    speciality: String,
    location: String,
});

const DocRegister = mongoose.model("DocRegister", docRegisterSchema);
module.exports = DocRegister;
