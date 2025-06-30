const express = require('express');
const view_patient = express.Router();
const { patient } = require('../model/modelpatient');
const { doctor } = require('../model/modeldoctor');

view_patient.get('/:patientId', async (req, res) => {
  const patientId = req.params.patientId;
console.log("View details route hit, patientId:", req.params.patientId);
  try {
    const foundPatient = await patient.findById(patientId).populate('doctorId');

    if (!foundPatient) {
      return res.status(404).send('Patient not found');
    }

    const doctor= foundPatient.doctorId

    res.render('view_details', {
      patient: foundPatient,
      doctor:doctor
    });
    console.log("got you")

  } catch (err) {
    console.error("Error fetching patient details:", err);
    res.status(500).send("Server error");
  }
});



module.exports = { view_patient };
