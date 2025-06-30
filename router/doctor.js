const express = require('express');
const doctor_account = express.Router();
const { doctor } = require('../model/modeldoctor');


doctor_account.get('/', async (req, res) => {
  const success = req.query.success === '1';
  res.render('Account_doctor', {
    success,
    email: '',
    error: null
  });
});

/// Doctor Sign-Up (Create Account)
doctor_account.get('/signup',async(req,res)=>{
    res.render('doctorNewAccount')
})
doctor_account.post('/signup', async (req, res) => {
  const { name, email, password, specialization, symptoms } = req.body;

  try {
    const existing = await doctor.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Doctor already exists' });
    }

     // Split symptoms string into array
    const symptomArray = symptoms
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean); // remove empty strings

    const newDoctor = new doctor({
      name,
      email,
      password,
      specialization,
      symptoms: symptomArray,
      available: true,
    });

    await newDoctor.save();
    res.redirect('/doctor?success=1');

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


doctor_account.post('/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).render("Account_doctor", {
        error: "All fields are required",
        email: rawEmail || "",
        success: false
      });
    }

    const email = rawEmail.trim().toLowerCase();

    const { token, user } = await doctor.matchpassword(email, password);

    if (!token || !user) {
      return res.status(401).render("Account_doctor", {
        error: "Invalid email or password",
        email: rawEmail,
        success: false
      });
    }

    res.cookie("token", token); // Set login token
    console.log(token)
    // ✅ Successful login → render profile page
    res.redirect(`/doctor/details/${user._id}`);

  } catch (error) {
    console.error(error);
    return res.status(401).render("Account_doctor", {
      error: error.message || "Login failed",
      email: req.body.email || "",
      success: false
    });
  }
});



/// Get doctor all detrails form
 
 doctor_account.get('/details/:doctorId', async (req, res) => {
  const doctorId = req.params.doctorId; 

  try {
    const foundDoctor = await doctor.findById(doctorId);

    if (!foundDoctor) return res.status(404).send('Doctor not found');
    
    res.render('doctorDetails', {
      doctor: foundDoctor
    });

  } catch (err) {
    console.error("Error fetching doctor by ID:", err);
    res.status(500).send("Server error");
  }
});

//logout
 doctor_account.get('/logout', (req,res)=>{
    return res.clearCookie('token').redirect('/doctor')
 })


module.exports = { doctor_account };
