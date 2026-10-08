// Fictional doctors used by the seed script and the demo reset
const SAMPLE_DOCTORS = [
  { username: "dr.karim.mansour", firstName: "Karim", lastName: "Mansour", specialization: "Cardiology", workingHours: "Mon - Fri 09:00 AM - 05:00 PM", fee: 60, experience: 18, qualification: "MD, Cardiology", photo: 1 },
  { username: "dr.rania.nasr", firstName: "Rania", lastName: "Nasr", specialization: "Pediatrics", workingHours: "Mon - Thu 08:00 AM - 02:00 PM", fee: 45, experience: 9, qualification: "MD, Pediatrics", photo: 2 },
  { username: "dr.samir.daher", firstName: "Samir", lastName: "Daher", specialization: "Orthopedics", workingHours: "Tue, Thu, Sat 10:00 AM - 06:00 PM", fee: 55, experience: 7, qualification: "MD, Orthopedic Surgery", photo: 3 },
  { username: "dr.ziad.sfeir", firstName: "Ziad", lastName: "Sfeir", specialization: "General Medicine", workingHours: "Mon - Sat 09:00 AM - 03:00 PM", fee: 35, experience: 14, qualification: "MD, Family Medicine", photo: 4 },
  { username: "dr.lina.kanaan", firstName: "Lina", lastName: "Kanaan", specialization: "Dermatology", workingHours: "Mon, Wed, Fri 11:00 AM - 07:00 PM", fee: 50, experience: 6, qualification: "MD, Dermatology", photo: 5 },
  { username: "dr.nour.haidar", firstName: "Nour", lastName: "Haidar", specialization: "Gynecology", workingHours: "Mon - Fri 08:30 AM - 04:30 PM", fee: 55, experience: 11, qualification: "MD, Obstetrics and Gynecology", photo: 6 },
  { username: "dr.fadi.aoun", firstName: "Fadi", lastName: "Aoun", specialization: "Neurology", workingHours: "Mon - Thu 09:00 AM - 05:00 PM", fee: 65, experience: 12, qualification: "MD, Neurology", photo: 7 },
  { username: "dr.hala.farah", firstName: "Hala", lastName: "Farah", specialization: "Oncology", workingHours: "Mon - Fri 08:00 AM - 02:00 PM", fee: 70, experience: 15, qualification: "MD, Medical Oncology", photo: 8 },
];

// Doctor profile fields as stored in the database
const toDoctorProfile = (d) => ({
  firstName: d.firstName,
  lastName: d.lastName,
  specialization: d.specialization,
  workingHours: d.workingHours,
  availability: true,
  fee: d.fee,
  experience: d.experience,
  qualification: d.qualification,
  photoUrl: `/doctors/doctor-${d.photo}.jpg`,
});

module.exports = { SAMPLE_DOCTORS, toDoctorProfile };
