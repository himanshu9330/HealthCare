const express = require('express');
const mongoose = require('mongoose');
const newPatient = express.Router();
const { patient } = require('../model/modelpatient');
const { appointment } = require('../model/modelappointment');

// Render search form page
newPatient.get('/', (req, res) => {
  res.render('findpatient', { error: '' });
});

// Search patient by ID and show details
newPatient.get('/search', async (req, res) => {
  const { patientId } = req.query;

  
  try {
    const foundPatient = await patient.findById(patientId).populate('history.doctorId').exec();

    if (!foundPatient) {
      return res.render('findpatient', { error: 'Patient not found!' });
    }

    res.render('patient-details', { patient: foundPatient });
  } catch (err) {
    console.error("Error in GET /search:", err);
    res.status(500).send('Server error');
  }
});


// Book appointment
newPatient.post('/book-appointment', async (req, res) => {
  const { patientId, symptoms } = req.body;

  if (!patientId || !symptoms) {
    return res.status(400).send('Missing patientId or symptoms');
  }

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).send('Invalid patient ID format');
  }

  try {
    const foundPatient = await patient.findById(patientId);

    if (!foundPatient) {
      return res.status(404).send('Patient not found');
    }

    const lastHistory = foundPatient.history.length > 0
      ? foundPatient.history[foundPatient.history.length - 1]
      : null;

    const doctorId = lastHistory?.doctorId || foundPatient.doctorId;

    if (!doctorId) {
      return res.status(400).send('No doctor found for this patient');
    }

    const symptomArray = Array.isArray(symptoms) ? symptoms : [symptoms];

    foundPatient.history.push({
      date: new Date(),
      symptoms: symptomArray,
      prescription: [],
      doctorId,
    });

    await foundPatient.save();

    await appointment.create({
      patientId,
      doctorId,
      timeSlot: new Date(),
      symptoms: symptomArray,
    });

    // Redirect back to patient search
    res.redirect(`/patient/search?patientId=${patientId}`);
  } catch (err) {
    console.error("Error in POST /book-appointment:", err);
    res.status(500).send('Server error');
  }
});

module.exports = {
  newPatient,
};
