import React from "react";
import { FaUsersCog } from "react-icons/fa";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import "./AdminUsersButton.css";
import { useAdmin } from "../../context/AdminContext";
import { AdminNavItem } from "../../pages/Admin/AdminPanel";

const AdminUsersButton = ({ renderContent = false }) => {
  const {
    activeSection,
    setActiveSection,
    users,
    openModal,
    handleDeleteUser,
  } = useAdmin();
  const isActive = activeSection === "users";

  return (
    <>
      {/*  Sidebar Button  */}
      {!renderContent && (
        <AdminNavItem
          active={isActive}
          onClick={() => setActiveSection("users")}
          icon={<FaUsersCog />}
          label="Users"
        />
      )}

      {/* Main Content */}
      {renderContent && isActive && (
        <div className="admin-users">
          <div className="section-content">
            {/* Section header (title + add user button) */}
            <div className="section-header">
              <h2>Users</h2>

              {/* Opens modal for creating a new user */}
              <button
                className="admin-users-add-btn"
                onClick={() => openModal("createUser")}
              >
                <span className="btn-icon">
                  <MdAdd />
                </span>
                Add user
              </button>
            </div>

            {/* Users table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loop through users and display each one in a table row */}
                  {users.map((user) => {
                    const createdDate = user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-";

                    return (
                      <tr key={user.id}>
                        {/* Username */}
                        <td>
                          <div className="user-info">
                            <span className="user-name">{user.username}</span>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Created date */}
                        <td>{createdDate}</td>

                        {/* Action buttons */}
                        <td>
                          <div className="action-buttons">
                            {/* Edit user*/}
                            <button
                              className="btn-icon edit"
                              onClick={() => openModal("editUser", user)}
                              title="Edit User"
                            >
                              <MdEdit color="blue" />
                            </button>

                            {/* Delete user  */}
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsersButton;
