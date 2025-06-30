const express = require('express');
const appointmentPage = express.Router();
const { patient } = require('../model/modelpatient');

/// Get Show prescription form
 appointmentPage.get('/form', async (req, res) => {
  const { patientId } = req.query;
  console.log('found')

  try {
    const foundPatient = await patient.findById(patientId).populate('doctorId');
    console.log('not found')
    if (!foundPatient) return res.status(404).send('Patient not found');
    
    res.render('bookingpage', {
      patient: foundPatient
    });

  } catch (err) {
    console.error("Error appointment details form:", err);
    res.status(500).send("Server error");
  }
});


module.exports = { appointmentPage};
