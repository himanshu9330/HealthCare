const express = require('express');
const book = express.Router();
const { patient } = require('../model/modelpatient');
const { appointment } = require('../model/modelappointment');
const { doctor } = require('../model/modeldoctor');
const mongoose = require('mongoose');

/// GET form to create new patient
book.get('/new-patient', (req, res) => {
  res.render('book', { error: '' }); 
});

/// POST route: create patient and auto-assign doctor
book.post('/new-patient', async (req, res) => {
  const { name, age, gender, symptoms, timeSlot } = req.body;

  if (!name && !age && !gender && !symptoms && !timeSlot) {
    return res.render('book', { error: 'All fields are required.' });
  }

  try {
    const symptomArray = symptoms.split(',').map(s => s.trim().toLowerCase());
    

    /// Find available doctor who treats at least one of the symptoms
    const matchingDoctor = await doctor.findOne({
      available: true,
      symptoms: { $in: symptomArray }
    });

    if (!matchingDoctor) {
        console.log('no doctor')
      return res.redirect('/book/new-patient?doctorError=1');
    }

    /// Create new patient
    const newPatient = await patient.create({
      name,
      age,
      gender,
      symptoms: symptomArray,
      doctorId: matchingDoctor._id,
      history: [{
        date: new Date(timeSlot),
        symptoms: symptomArray,
         prescription: [],
        doctorId: matchingDoctor._id
      }]
    });

    /// Book appointment
    await appointment.create({
      patientId: newPatient._id,
      doctorId: matchingDoctor._id,
      timeSlot,
      symptoms: symptomArray
      
    });

    ///Redirect to patient profile/search
    console.log('detail filled')
    res.redirect(`/booked/form?patientId=${newPatient._id}`);

  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).send("Server error");
  }
});





module.exports = { book };
