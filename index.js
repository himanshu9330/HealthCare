const express=require('express')
const path = require("path");
const mongoose = require('mongoose');

//jwt auth
const cookieParser = require("cookie-parser");
const {Checkforauthentication}=require("./middleware/auth")

///roters
const {book}=require('./router/appointmentrouter')
const {newPatient}=require('./router/findpatient')
const{appointmentPage}=require('./router/bookingpage')
const {doctor_account}=require('./router/doctor')
const{All_appointment}=require('./router/All_appointment')
const {view_patient}=require('./router/view_details')
const {AI_prescription}=require('./router/AI_prescription')
const {patient_details}=require('./router/patient_details')

const app=express();
const port =8000;

///mongodb connection
mongoose.connect('mongodb://127.0.0.1:27017/health')
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.get("/", (req,res)=>{
    res.render('home')
})
app.use(Checkforauthentication("token"))
app.use('/book',book);
app.use('/patient', newPatient);
app.use('/booked',appointmentPage)
app.use('/doctor',doctor_account);
app.use('/appointment/doctor',All_appointment);
app.use('/details',view_patient)
app.use('/ai',AI_prescription)
app.use('/patientdetail',patient_details);

app.listen(port, ()=>{
    console.log("server start")
})