const { Doctor, Appointment } = require("../models");
const { Op } = require("sequelize");
const { clinicNow } = require("../utils/clinicTime");
const { addDays, getFreeSlots, SLOT_MINUTES } = require("../utils/availability");
const { INACTIVE_STATUSES } = require("../utils/appointmentStatus");

// Free times for every available doctor over the next `days` days (default 14, at most 31).
// One query for all bookings in the range, so the booking page needs a single request.
exports.getAvailability = async (req, res) => {
  try {
    const requested = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 31) : 14;
    const now = clinicNow();
    const from = now.date;
    const to = addDays(from, days - 1);

    const [doctors, appointments] = await Promise.all([
      Doctor.findAll({ where: { availability: true }, attributes: ["id", "workingHours"] }),
      Appointment.findAll({
        where: {
          appointmentDate: { [Op.between]: [from, to] },
          status: { [Op.notIn]: INACTIVE_STATUSES },
        },
        attributes: ["doctorId", "appointmentDate", "appointmentTime"],
      }),
    ]);

    // doctorId -> date -> Set of "HH:MM"
    const booked = {};
    for (const a of appointments) {
      if (!a.appointmentTime) continue;
      const byDate = (booked[a.doctorId] ||= {});
      (byDate[a.appointmentDate] ||= new Set()).add(String(a.appointmentTime).slice(0, 5));
    }

    res.json({
      from,
      days,
      slotMinutes: SLOT_MINUTES,
      doctors: doctors.map((d) => ({
        doctorId: d.id,
        days: getFreeSlots({ workingHours: d.workingHours, booked: booked[d.id], from, days, now }),
      })),
    });
  } catch (error) {
    console.error("Error computing availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};
