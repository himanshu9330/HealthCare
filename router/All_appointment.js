const express = require('express');
const All_appointment = express.Router();
const { patient } = require('../model/modelpatient');
const { doctor } = require('../model/modeldoctor');

/// Get all patients assigned to a doctor on the same date
All_appointment.get('/patients/:doctorId/:date', async (req, res) => {
  const { doctorId, date } = req.params;

  try {
    const foundDoctor = await doctor.findById(doctorId);
    if (!foundDoctor) return res.status(404).send('Doctor not found');
    /// Convert date string to start and end of day
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    /// Find patients whose appointment history has the same doctorId and date
    const patients = await patient.find({
      doctorId: doctorId,
      'history.date': { $gte: targetDate, $lt: nextDate }
    });

    res.render('All_appointment', {doctor: foundDoctor, date, patients });

  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).send("Server error");
  }
});

module.exports = {All_appointment};
