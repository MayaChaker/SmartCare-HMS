import React from "react";
import "./EditButton.css";
import { DashboardProfileEditForm } from "../../DashboardProfile/DashboardProfile";

const EditButton = ({ openModal, onClick }) => {
  const handleClick = () => {
    if (openModal) {
      openModal("editProfile");
      return;
    }
    if (onClick) onClick();
  };
  return (
    <button className="edit-btn" type="button" onClick={handleClick}>
      Edit Profile
    </button>
  );
};

export default EditButton;

export const EditProfileModal = ({ profile, loading, onSubmit, closeModal }) => {
  return (
    <DashboardProfileEditForm
      profile={profile}
      loading={loading}
      onSubmit={onSubmit}
      closeModal={closeModal}
    />
  );
};
