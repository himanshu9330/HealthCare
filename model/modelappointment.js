const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient', 
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',  
    required: true
  },
  timeSlot: {
    type: Date,
    required: true
  },
  symptoms: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

const appointment = mongoose.model('appointment', appointmentSchema);

module.exports = {
  appointment
};
