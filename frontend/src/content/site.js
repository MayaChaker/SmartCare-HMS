// Text and data for the public website, kept apart from the layout so it is easy to edit.
// This is example content for a demo project.

export const contact = {
  emergency: "01 555 000",
  mainLine: "+961 1 555 000",
  coordinators: "+961 1 555 100",
  email: "info@smartcare.example",
  internationalEmail: "international@smartcare.example",
  address: "Hamra Street, Beirut, Lebanon",
};

export const navLinks = [
  { label: "Centers", href: "#centers" },
  { label: "Doctors", href: "#doctors" },
  { label: "Patient Experience", href: "#experience" },
  { label: "Facilities", href: "#facilities" },
  { label: "Contact", href: "#contact" },
];

export const centers = [
  { name: "Cardiology", summary: "Heart rhythm, imaging and minimally invasive procedures", image: "/images/site/cardio.jpg" },
  { name: "Neurosciences", summary: "Brain, spine and memory care", image: "/images/site/neuro.jpg" },
  { name: "Orthopaedics & Sports", summary: "Joint replacement and return-to-play programs", image: "/images/site/xray.jpg" },
  { name: "Oncology", summary: "Precision diagnostics and personalised treatment plans", image: "/images/site/lab.jpg" },
  { name: "Women's Health", summary: "Gynaecology, fertility and maternity suites", image: "/images/site/consultation.jpg" },
  { name: "Executive Health", summary: "A complete check-up in one morning, results the same day", image: "/images/site/scan-review.jpg" },
];

export const doctors = [
  {
    name: "Dr. Karim Mansour",
    role: "Head of Cardiology",
    credentials: "MD, Saint Joseph University · Fellowship in interventional cardiology, Paris · 18 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-1.jpg",
  },
  {
    name: "Dr. Nadine Khoury",
    role: "Women's Health",
    credentials: "MD, American University of Beirut · Specialist in high-risk pregnancy · 15 years",
    languages: "Arabic · English",
    photo: "/doctors/doctor-6.jpg",
  },
  {
    name: "Dr. Elie Nassar",
    role: "Orthopaedic Surgery",
    credentials: "MD · Fellowship in sports medicine and joint replacement · 12 years",
    languages: "Arabic · English · French",
    photo: "/doctors/doctor-3.jpg",
  },
  {
    name: "Dr. Rania Haddad",
    role: "Dermatology",
    credentials: "MD · Medical and aesthetic dermatology, skin cancer screening · 11 years",
    languages: "Arabic · English",
    photo: "/doctors/doctor-2.jpg",
  },
];

export const experienceStories = [
  {
    label: "Your room",
    caption: "Private inpatient room",
    title: "A private room, never a shared ward.",
    text: "Every inpatient room is private, with full medical monitoring built into the wall and a recliner so one family member can stay the night.",
    image: "/images/site/patient-room.jpg",
    imageAlt: "A private inpatient room with a medical bed, infusion stand and a recliner for family",
    facts: [
      { label: "Nurse to patient", value: "1 : 3", big: true },
      { label: "Nurse response", value: "< 3 min", big: true },
      { label: "Family stay", value: "Recliner bed and meals" },
      { label: "Quiet hours", value: "9 PM to 7 AM" },
    ],
  },
  {
    label: "Your coordinator",
    caption: "Your patient coordinator",
    title: "One person who knows your whole file.",
    text: "From the first call to your follow-up visit, your coordinator books every appointment and test, chases results, and explains the next step.",
    image: "/images/site/consultation.jpg",
    imageAlt: "A doctor talking calmly with a patient",
    facts: [
      { label: "Call back", value: "2 h", big: true },
      { label: "Test results", value: "Same day", big: true },
      { label: "Reach them", value: "Phone or WhatsApp" },
      { label: "Urgent visits", value: "Same-day slots" },
    ],
  },
  {
    label: "From abroad",
    caption: "International patients",
    title: "Your scans reviewed before you fly.",
    text: "Send your reports and imaging. A specialist gives a written opinion and treatment estimate, and our international desk handles the rest.",
    image: "/images/site/scan-review.jpg",
    imageAlt: "A specialist reviewing a scan with a patient",
    facts: [
      { label: "Second opinion", value: "72 h", big: true },
      { label: "Visa letter", value: "48 h", big: true },
      { label: "Languages", value: "Arabic, English, French" },
      { label: "Insurance", value: "Direct international billing" },
    ],
  },
];

export const facilities = [
  { title: "Hybrid operating theatres", detail: "imaging and surgery in one room", image: "/images/site/theatre.jpg", alt: "A modern hybrid operating theatre", featured: true },
  { title: "Molecular laboratory", image: "/images/site/lab.jpg", alt: "Scientists working in a modern laboratory" },
  { title: "Digital imaging", image: "/images/site/xray.jpg", alt: "Digital X-ray images on a light panel" },
  { title: "Day-surgery rooms", image: "/images/site/day-surgery.jpg", alt: "A bright, clean treatment room" },
  { title: "Neuro-navigation", image: "/images/site/neuro.jpg", alt: "An anatomical model of the human brain" },
];

export const hospitalNumbers = [
  { label: "Private rooms", value: "48" },
  { label: "Specialists", value: "32" },
  { label: "Operating theatres", value: "6" },
  { label: "Results", value: "1 h" },
];

export const testimonials = [
  {
    quote: "From the airport to the day I flew home, I never had to ask for anything twice. It felt like being looked after by family.",
    author: "L. M. · Cardiology patient · London",
  },
  {
    quote: "My doctor spent an hour with me before deciding anything. I left understanding my own treatment.",
    author: "R. S. · Orthopaedics patient · Dubai",
  },
  {
    quote: "Quiet, discreet and kind. My family could stay with me every night.",
    author: "N. A. · Women's Health patient · Beirut",
  },
];

export const footerColumns = [
  {
    title: "Centers",
    links: centers.map((c) => ({ label: c.name.replace(" & Sports", ""), href: "#centers" })),
  },
  {
    title: "Patients & Visitors",
    links: [
      { label: "Book an appointment", href: "/register" },
      { label: "Patient portal", href: "/login" },
      { label: "Visiting hours", href: "#visiting-hours" },
      { label: "Insurance & billing", href: "#contact" },
      { label: "Medical records", href: "/login" },
    ],
  },
  {
    title: "International",
    links: [
      { label: "Second opinion", href: "#experience" },
      { label: "Travel & visas", href: "#experience" },
      { label: "Interpreters", href: "#experience" },
      { label: "Cost estimate", href: "#contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our doctors", href: "#doctors" },
      { label: "Facilities", href: "#facilities" },
      { label: "Contact us", href: "#contact" },
    ],
  },
];

export const openingHours = [
  { label: "Outpatient clinics", value: "Mon to Sat, 8 AM to 8 PM" },
  { label: "Visiting hours", value: "every day, 10 AM to 9 PM" },
  { label: "Laboratory", value: "Mon to Sat, 7 AM to 7 PM" },
];
