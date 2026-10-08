import { useState } from "react";
import { doctorName, doctorPhoto } from "./format";

// Doctor portrait, or initials when there is no photo (or it fails to load)
export default function DoctorAvatar({ doctor, size = 56 }) {
  const [broken, setBroken] = useState(false);
  const src = doctorPhoto(doctor);
  const initials = `${doctor?.firstName?.[0] || ""}${doctor?.lastName?.[0] || ""}` || "Dr";

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={doctorName(doctor)}
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className="photo-grade shrink-0 rounded-full object-cover object-[50%_20%]"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-forest text-[15px] text-ivory"
    >
      {initials}
    </span>
  );
}
