// Text for the patient portal, kept apart from the layout so it is easy to edit.
// This is example content for a demo project.
import { contact } from "./site";

export const patientOffice = {
  whatsapp: contact.whatsapp,
  phone: contact.coordinators,
  hours: "8:00 to 20:00, every day",
};

// Where each department receives patients. Departments that are not listed use the outpatient clinics.
const PLACES = {
  Cardiology: "Heart Centre · Level 3, East wing",
  Pediatrics: "Children's Clinic · Level 1",
  Orthopedics: "Orthopaedics · Level 2, West wing",
  "General Medicine": "Outpatient Clinics · Level 1",
  Dermatology: "Dermatology · Level 2, East wing",
  Gynecology: "Women's Health · Level 4",
  Neurology: "Neuroscience Centre · Level 3, West wing",
  Oncology: "Cancer Centre · Level 5",
  Ophthalmology: "Eye Clinic · Level 1, East wing",
  ENT: "Ear, Nose and Throat · Level 1, West wing",
  Psychiatry: "Mind and Wellbeing · Level 4, quiet wing",
  Endocrinology: "Diabetes and Hormones · Level 2, West wing",
  Urology: "Urology · Level 2, East wing",
  Gastroenterology: "Digestive Health · Level 3, East wing",
};
export const departmentPlace = (specialization) => PLACES[specialization] || PLACES["General Medicine"];
export const departments = Object.keys(PLACES);

export const arrivalNote = "Main entrance, Hamra Street. Valet parking at the door.";
export const whatToBring = "Your ID, insurance card and the medicines you take now";

// Shown when booking. The label is saved as the visit's reason.
export const visitTypes = [
  { label: "New consultation", hint: "First visit for a new concern", length: "30 min" },
  { label: "Follow-up", hint: "After a recent visit or treatment", length: "20 min" },
  { label: "Test results", hint: "Go through results with your doctor", length: "20 min" },
  { label: "Annual check-up", hint: "Full review of your health", length: "45 min" },
  { label: "Second opinion", hint: "Bring your reports and scans", length: "45 min" },
];

// Requested through the Private Patient Office
export const services = [
  { title: "Chauffeur pick-up", text: "From your home or the airport, in Beirut and Mount Lebanon." },
  { title: "Interpreter", text: "Arabic, English and French at every visit." },
  { title: "Medicine delivered", text: "Your prescriptions brought to your door the same day." },
  { title: "Second opinion", text: "Send your scans and reports to one of our specialists." },
];
