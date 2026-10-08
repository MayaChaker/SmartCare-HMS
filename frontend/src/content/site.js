// Text and data for the public website, kept apart from the layout so it is easy to edit.
// This is example content for a demo project.

export const contact = {
  emergency: "01 555 000",
  mainLine: "+961 1 555 000",
  coordinators: "+961 1 555 100",
  email: "info@smartcare.example",
  whatsapp: "+961 70 555 100",
  internationalEmail: "international@smartcare.example",
  address: "Hamra Street, Beirut, Lebanon",
};

// The actions used across the site. Each has one label, everywhere it appears.
// "book" and "consultation" both open the booking form, each with its own request type selected.
export const actions = {
  book: { label: "Book an appointment", href: "#book" },
  consultation: { label: "Request a private consultation", href: "#book" },
  portal: { label: "Patient portal", href: "/login" },
};

export const requestTypes = [
  {
    value: "appointment",
    label: "Appointment",
    hint: "A regular visit with one of our specialists.",
  },
  {
    value: "consultation",
    label: "Private consultation",
    hint: "A 60-minute meeting with a senior specialist, in person or by video, to review your case in depth.",
  },
];

export const navLinks = [
  { label: "Centers", href: "#centers" },
  { label: "Doctors", href: "#doctors" },
  { label: "Patient Experience", href: "#experience" },
  { label: "Facilities", href: "#facilities" },
];

export const centers = [
  {
    name: "Cardiology",
    summary: "Diagnosis and treatment of heart and blood vessel disease, from the first check to rehabilitation.",
    services: ["Echocardiography and cardiac CT", "Catheterisation and stenting", "Heart rhythm clinic", "Cardiac rehabilitation"],
    lead: "Dr. Karim Mansour",
    specialists: 5,
    image: "/images/site/center-cardiology.jpg",
    imageAlt: "A patient monitor showing a heart rhythm",
  },
  {
    name: "Neurosciences",
    summary: "Neurologists and neurosurgeons who review every brain and spine case together.",
    services: ["Stroke unit", "Epilepsy and sleep studies", "Spine surgery", "Memory clinic"],
    lead: "Dr. Fadi Aoun",
    specialists: 5,
    image: "/images/site/center-neuro.jpg",
    imageAlt: "Two doctors reviewing brain MRI scans",
  },
  {
    name: "Orthopaedics",
    summary: "Bone, joint and sports injury care, with surgery and physiotherapy in the same team.",
    services: ["Knee and hip replacement", "Arthroscopic surgery", "Sports injury clinic", "Physiotherapy"],
    lead: "Dr. Samir Daher",
    specialists: 6,
    image: "/images/site/center-ortho.jpg",
    imageAlt: "A specialist examining a patient's knee",
  },
  {
    name: "Oncology",
    summary: "Every new diagnosis is reviewed by a tumour board before a personal treatment plan is agreed.",
    services: ["Tumour board review", "Chemotherapy day unit", "Radiation therapy", "Genetic counselling"],
    lead: "Dr. Hala Farah",
    specialists: 6,
    image: "/images/site/center-oncology.jpg",
    imageAlt: "A radiation therapy room",
  },
  {
    name: "Women's Health",
    summary: "Care through every stage of life, with private maternity suites and a dedicated midwife team.",
    services: ["High-risk pregnancy", "Fertility clinic", "Private maternity suites", "Breast health"],
    lead: "Dr. Nour Haidar",
    specialists: 6,
    image: "/images/site/center-womens.jpg",
    imageAlt: "An expecting mother holding an ultrasound photo",
  },
  {
    name: "Executive Health",
    summary: "A complete health assessment in one morning, with your results explained the same afternoon.",
    services: ["Full check-up in one morning", "Heart and cancer screening", "Same-day results review", "Personal health plan"],
    lead: "Dr. Ziad Sfeir",
    specialists: 4,
    image: "/images/site/center-executive.jpg",
    imageAlt: "A doctor measuring a patient's blood pressure",
  },
];

// Same doctors as the demo accounts in the app (backend/demo/sampleData.js)
export const doctors = [
  {
    name: "Dr. Karim Mansour",
    role: "Head of Cardiology",
    credentials: "MD, Saint Joseph University · Fellowship in interventional cardiology, Paris · 18 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-1.jpg",
  },
  {
    name: "Dr. Nour Haidar",
    role: "Women's Health",
    credentials: "MD, Obstetrics and Gynecology · Specialist in high-risk pregnancy · 11 years",
    languages: "Arabic · English",
    photo: "/doctors/doctor-6.jpg",
  },
  {
    name: "Dr. Fadi Aoun",
    role: "Head of Neurosciences",
    credentials: "MD · Fellowship in stroke and epilepsy care, Montreal · 12 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-7.jpg",
  },
  {
    name: "Dr. Hala Farah",
    role: "Head of Oncology",
    credentials: "MD · Medical oncology, leads the weekly tumour board · 15 years",
    languages: "Arabic · English",
    photo: "/doctors/doctor-8.jpg",
  },
  {
    name: "Dr. Samir Daher",
    role: "Orthopaedic Surgery",
    credentials: "MD · Sports injuries and arthroscopic surgery · 7 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-3.jpg",
  },
  {
    name: "Dr. Ziad Sfeir",
    role: "Head of Executive Health",
    credentials: "MD, Family Medicine · Preventive check-ups and long-term care · 14 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-4.jpg",
  },
  {
    name: "Dr. Rania Nasr",
    role: "Pediatrics",
    credentials: "MD, American University of Beirut · Care from newborns to teenagers · 9 years",
    languages: "Arabic · English",
    photo: "/doctors/doctor-2.jpg",
  },
  {
    name: "Dr. Lina Kanaan",
    role: "Dermatology",
    credentials: "MD · Medical dermatology and skin cancer screening · 6 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-5.jpg",
  },
];

export const experienceStories = [
  {
    caption: "Private inpatient room",
    title: "A private room, never a shared ward.",
    text: "Every inpatient room is private, with full medical monitoring built into the wall and a recliner so one family member can stay the night.",
    image: "/images/site/patient-room.jpg",
    imageAlt: "A private inpatient room with a medical bed, infusion stand and a recliner for family",
    facts: [
      { label: "Nurse to patient", value: "1 : 3" },
      { label: "Nurse response", value: "< 3 min" },
    ],
  },
  {
    caption: "Your patient coordinator",
    title: "One person who knows your whole file.",
    text: "From the first call to your follow-up visit, your coordinator books every appointment and test, chases results, and explains the next step.",
    image: "/images/site/consultation.jpg",
    imageAlt: "A doctor talking with a patient in her hospital room",
    facts: [
      { label: "Call back", value: "2 h" },
      { label: "Test results", value: "Same day" },
    ],
  },
  {
    caption: "International patients",
    title: "Your scans reviewed before you fly.",
    text: "Send your reports and imaging. A specialist gives a written opinion and treatment estimate, and our international desk handles the rest.",
    image: "/images/site/scan-review.jpg",
    imageAlt: "A specialist reviewing a scan with a patient",
    facts: [
      { label: "Second opinion", value: "72 h" },
      { label: "Visa letter", value: "48 h" },
    ],
  },
];

export const facilities = [
  { title: "Hybrid operating theatres", detail: "Imaging and surgery in the same room, so surgeons see live scans while they operate.", image: "/images/site/theatre.jpg", alt: "A modern hybrid operating theatre" },
  { title: "Advanced imaging", detail: "3T MRI, low-dose CT and digital X-ray, reported by a radiologist the same day.", image: "/images/site/imaging.jpg", alt: "A CT scanner in a calm imaging room" },
  { title: "On-site laboratory", detail: "Most blood results reach your doctor within the hour.", image: "/images/site/lab.jpg", alt: "Scientists working in a modern laboratory" },
  { title: "Day-surgery suites", detail: "Planned procedures with a private recovery room and home the same evening.", image: "/images/site/day-surgery.jpg", alt: "A bright, clean treatment room" },
];

export const hospitalNumbers = [
  { label: "Private rooms", value: "48" },
  { label: "Specialists", value: "32" },
  { label: "Operating theatres", value: "6" },
  { label: "Results", value: "1 h" },
];

export const footerLinks = [
  {
    title: "Appointments",
    links: [
      { label: "Book an appointment", href: "#book" },
      { label: "Private consultation", href: "#book" },
      { label: "Find a doctor", href: "#doctors" },
      { label: "Patient portal", href: "/login" },
    ],
  },
  {
    title: "Centers",
    links: centers.map((c) => ({ label: c.name, href: "#centers" })),
  },
  {
    title: "Patients",
    links: [
      { label: "Patient experience", href: "#experience" },
      { label: "Technology & facilities", href: "#facilities" },
      { label: "Insurance & billing", href: "#book" },
      { label: "Share your feedback", href: "#book" },
    ],
  },
  {
    title: "International",
    links: [
      { label: "Second opinion", href: "#experience" },
      { label: "Travel & visas", href: "#experience" },
      { label: "Interpreters", href: "#experience" },
      { label: "Cost estimate", href: "#book" },
    ],
  },
];

// Placeholder accounts: replace with the hospital's real profiles
export const socialLinks = [
  { label: "Instagram", href: "#site-footer" },
  { label: "LinkedIn", href: "#site-footer" },
  { label: "Facebook", href: "#site-footer" },
  { label: "YouTube", href: "#site-footer" },
];

export const legalLinks = ["Privacy policy", "Cookie settings", "Terms of use", "Accessibility", "Patient rights"];

export const openingHours = [
  { label: "Outpatient clinics", value: "Mon to Sat, 8 AM to 8 PM" },
  { label: "Visiting hours", value: "every day, 10 AM to 9 PM" },
  { label: "Laboratory", value: "Mon to Sat, 7 AM to 7 PM" },
];
