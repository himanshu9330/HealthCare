const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medicines: [{
    name: String,
    dosage: String,
    instructions: String,
  }],
  date: {
    type: Date,
    default: Date.now,
  },
  diagnosis: {
    type: String,
    required: false,  // optional field
  },
  notes: String, // optional extra notes
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = {Prescription};
