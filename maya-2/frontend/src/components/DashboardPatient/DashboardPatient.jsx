import React, { useEffect } from "react";
import { patientAPI } from "../../utils/api";

const DashboardPatient = ({
  onExposeUpdateProfile,
  setLoading = () => {},
  setError = () => {},
  setSuccess = () => {},
  setProfile = () => {},
  closeModal = () => {},
}) => {
  useEffect(() => {
    const updateProfile = async (updatedProfile) => {
      setLoading(true);
      try {
        const response = await patientAPI.updateProfile(updatedProfile);
        if (response.success) {
          const profileResponse = await patientAPI.getProfile();
          if (profileResponse.success) {
            setProfile(profileResponse.data);
          }
          setSuccess("Profile updated successfully!");
          closeModal();
        } else {
          setError(response.message || "Failed to update profile");
        }
      } catch {
        setError("Failed to update profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (typeof onExposeUpdateProfile === "function") {
      onExposeUpdateProfile(updateProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default DashboardPatient;
