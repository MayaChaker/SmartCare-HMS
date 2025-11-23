import { patientAPI } from "../utils/api";

export const bookAppointment = async (
  appointmentData,
  {
    availableSlots,
    appointments,
    setLoading,
    setError,
    setSuccess,
    loadPatientData,
    closeModal,
  }
) => {
  setLoading(true);
  try {
    const doctorForBooking = availableSlots.find(
      (d) => d.id === parseInt(appointmentData.doctorId)
    );
    if (doctorForBooking && doctorForBooking.availability === false) {
      setError(
        "Selected doctor is currently unavailable. Please choose another date or doctor."
      );
      setLoading(false);
      return;
    }

    const conflict = appointments.some(
      (a) =>
        parseInt(a.doctorId) === parseInt(appointmentData.doctorId) &&
        String(a.appointmentDate) === String(appointmentData.appointmentDate) &&
        a.appointmentTime &&
        appointmentData.appointmentTime &&
        String(a.appointmentTime).slice(0, 5) ===
          String(appointmentData.appointmentTime).slice(0, 5) &&
        String(a.status).toLowerCase() !== "cancelled"
    );
    if (conflict) {
      setError("Selected date/time is already booked for this doctor.");
      setLoading(false);
      return;
    }

    const response = await patientAPI.bookAppointment(appointmentData);
    if (response.success) {
      setSuccess("Appointment booked successfully!");
      await loadPatientData();
      closeModal();
    } else {
      setError(response.message || "Failed to book appointment");
    }
  } catch (error) {
    console.error(error);
    setError("Failed to book appointment. Please try again.");
  } finally {
    setLoading(false);
  }
};

export const cancelAppointment = async (
  appointmentId,
  { setLoading, setError, setSuccess, loadPatientData, closeModal }
) => {
  setLoading(true);
  try {
    const response = await patientAPI.cancelAppointment(appointmentId);
    if (response.success) {
      setSuccess("Appointment cancelled successfully!");
      await loadPatientData();
      closeModal();
    } else {
      setError(response.message || "Failed to cancel appointment");
    }
  } catch (error) {
    console.error(error);
    setError("Failed to cancel appointment. Please try again.");
  } finally {
    setLoading(false);
  }
};

export const deleteAppointment = async (
  appointmentId,
  { setLoading, setError, setSuccess, loadPatientData, closeModal }
) => {
  setLoading(true);
  try {
    const response = await patientAPI.deleteAppointment(appointmentId);
    if (response.success) {
      setSuccess("Appointment deleted successfully!");
      await loadPatientData();
      closeModal();
    } else {
      setError(response.message || "Failed to delete appointment");
    }
  } catch (error) {
    console.error(error);
    setError("Failed to delete appointment. Please try again.");
  } finally {
    setLoading(false);
  }
};

export const rescheduleAppointment = async (
  appointmentId,
  newSlotData,
  { setLoading, setError, setSuccess, loadPatientData, closeModal }
) => {
  setLoading(true);
  try {
    const newTime = String(newSlotData || "").slice(0, 5);
    if (!newTime) {
      setError("Please select a time");
      setLoading(false);
      return;
    }
    const payload = {
      appointmentTime: `${newTime}:00`,
    };
    const response = await patientAPI.rescheduleAppointment(
      appointmentId,
      payload
    );
    if (response.success) {
      setSuccess("Appointment rescheduled successfully!");
      await loadPatientData();
      closeModal();
    } else {
      setError(response.message || "Failed to reschedule appointment");
    }
  } catch (error) {
    console.error(error);
    setError("Failed to reschedule appointment. Please try again.");
  } finally {
    setLoading(false);
  }
};
