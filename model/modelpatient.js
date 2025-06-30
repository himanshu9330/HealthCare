const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String,
    required: true
  }],
  
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  history: [{
    date: {
      type: Date,
      required: true
    },
    symptoms: [{
      type: String,
      required: true
    }],
    prescription: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Prescription',
      required: false
    }],
    diagnosis: {
      type: String,
      required: false
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'doctor',
      required: true
    }
  }]
}, { timestamps: true });

const patient = mongoose.model("patient", patientSchema);

module.exports = {
  patient
};
