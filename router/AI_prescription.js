const express = require('express');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { patient } = require('../model/modelpatient');
const { Prescription } = require('../model/Prescription');
const { doctor } = require('../model/modeldoctor');

dotenv.config();
const AI_prescription = express.Router();

AI_prescription.get('/generate-prescription/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Find patient and populate prescriptions inside history
    const foundPatient = await patient.findById(patientId)
      .populate({
        path: 'history.prescription',
        model: 'Prescription',
      });

    if (!foundPatient) {
      return res.status(404).send('Patient not found');
    }

    // Prepare prompt with patient data for AI (your existing prompt code)
    const prompt = `
You are an experienced medical AI. Based on the symptoms and medical history, provide a prescription including:

1. Diagnosis (if any).
2. Medicines (name, dosage, instructions).

Format the response **strictly in JSON**:

{
  "diagnosis": "string or null",
  "medicines": [
    { "name": "Medicine Name", "dosage": "Dosage", "instructions": "Instructions" }
  ]
}

Symptoms: ${foundPatient.symptoms.join(', ')}

Medical History:
${
  foundPatient.history && foundPatient.history.length > 0
    ? foundPatient.history.map(h => `Date: ${new Date(h.date).toLocaleDateString()}, Symptoms: ${h.symptoms.join(', ')}`).join('\n')
    : 'No prior history.'
}
    `;

    // Call OpenRouter API (your existing fetch code)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Prescription App"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("No choices returned from DeepSeek.");
    }

    const rawText = data.choices[0].message.content.trim();

// Extract the first valid JSON object from the response
const jsonStart = rawText.indexOf('{');
const jsonEnd = rawText.lastIndexOf('}');
const jsonString = rawText.substring(jsonStart, jsonEnd + 1);

let prescriptionData;
try {
  prescriptionData = JSON.parse(jsonString);
} catch (err) {
  console.error("❌ Failed to parse DeepSeek JSON:\n", jsonString);
  return res.status(500).send("DeepSeek JSON could not be parsed.");
}


    // Create new Prescription document
    const newPrescription = new Prescription({
      diagnosis: prescriptionData.diagnosis || undefined,
      medicines: prescriptionData.medicines || [],
    });
    await newPrescription.save();

    // Push new history entry referencing Prescription ObjectId(s)
    foundPatient.history.push({
      date: new Date(),
      symptoms: foundPatient.symptoms,
      prescription: [newPrescription._id], // ObjectId array as per schema
      diagnosis: prescriptionData.diagnosis || undefined,
      doctorId: foundPatient.doctorId, // required by schema
    });

    await foundPatient.save();

    // Re-populate with prescriptions for rendering (including newly added one)
    const patientWithHistory = await patient.findById(patientId)
      .populate({
        path: 'history.prescription',
        model: 'Prescription',
      });

     const doctorObj = await doctor.findById(foundPatient.doctorId);


    res.render('prescription', {
      patient: patientWithHistory,
      prescription: newPrescription,
      doctor: doctorObj
    });

  } catch (err) {
    console.error("❌ Error generating prescription with DeepSeek:", err);
    res.status(500).send("Failed to generate prescription.");
  }
});

module.exports = { AI_prescription };
