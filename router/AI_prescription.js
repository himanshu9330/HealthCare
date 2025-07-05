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
    console.log("Route hit, patientId:", patientId);

    // Check API key presence
    console.log("OPENROUTER_API_KEY loaded:", !!process.env.OPENROUTER_API_KEY);
    console.log("OPENROUTER_API_KEY (first 8 chars):", process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.slice(0, 8) + '...' : 'undefined');

    // Find patient and populate prescriptions inside history
    const foundPatient = await patient.findById(patientId)
      .populate({
        path: 'history.prescription',
        model: 'Prescription',
      });

    if (!foundPatient) {
      console.warn("Patient not found for ID:", patientId);
      return res.status(404).send('Patient not found');
    }

    console.log("Found patient:", foundPatient.name);

    // Prepare prompt with patient data for AI
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

    console.log("Prompt to AI:\n", prompt);

    // Call OpenRouter API
    console.log("Calling OpenRouter API...");
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

    console.log("OpenRouter API response status:", response.status);

    const responseText = await response.text();
    console.log("OpenRouter API raw response text:\n", responseText);

    if (!response.ok) {
      console.error("OpenRouter API error response:", responseText);
      return res.status(500).send(`OpenRouter API error: ${responseText}`);
    }

    // Parse the API JSON response
    const data = JSON.parse(responseText);

    if (!data.choices || !data.choices[0]) {
      throw new Error("No choices returned from OpenRouter API.");
    }

    const rawText = data.choices[0].message.content.trim();

    // Extract JSON part from AI response
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    const jsonString = rawText.substring(jsonStart, jsonEnd + 1);

    let prescriptionData;
    try {
      prescriptionData = JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ Failed to parse AI JSON response:\n", jsonString);
      return res.status(500).send("Failed to parse AI response JSON.");
    }

    console.log("Parsed prescription data:", prescriptionData);

    // Create new Prescription document
    const newPrescription = new Prescription({
      diagnosis: prescriptionData.diagnosis || undefined,
      medicines: prescriptionData.medicines || [],
    });
    await newPrescription.save();

    console.log("Saved new prescription with ID:", newPrescription._id);

    // Push new history entry referencing Prescription ObjectId(s)
    foundPatient.history.push({
      date: new Date(),
      symptoms: foundPatient.symptoms,
      prescription: [newPrescription._id], // ObjectId array as per schema
      diagnosis: prescriptionData.diagnosis || undefined,
      doctorId: foundPatient.doctorId, // required by schema
    });

    await foundPatient.save();
    console.log("Updated patient history with new prescription");

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
    console.error("❌ Full error stack:", err.stack || err);
    res.status(500).send(`Failed to generate prescription. Error: ${err.message || err}`);
  }
});

module.exports = { AI_prescription };
