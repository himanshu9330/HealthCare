const express= require('express')
const {patient}= require('../model/modelpatient')
const {doctor}= require('../model/modeldoctor')
const patient_details= express.Router();

patient_details.get('/', (req,res)=>{
    res.render('find_patient_by_id')
})

patient_details.post('/loginID',async(req,res)=>{
     const { patientId} = req.body;
     const foundPatient= await patient.findById(patientId).populate('history.prescription')
      if (!foundPatient) {
      return res.status(404).send('Patient not found');
    }
    const founddoctor= await doctor.findById(foundPatient.doctorId);
     res.redirect(`/patientdetail/${patientId}`);

})


patient_details.get('/:patientId',async(req,res)=>{
    const patientid=req.params.patientId;

    const foundPatient= await patient.findById(patientid).populate('doctorId') 
      .populate({
        path: 'history.prescription',
        populate: { path: 'medicines' }
      });
   
    if(!foundPatient){
        res.redirect('/')
    }else{
         const founddoctor= foundPatient.doctorId;
        res.render('patient-details',{
            patient: foundPatient,
            doctor:founddoctor || null
    })
    }

})

module.exports={
    patient_details
}