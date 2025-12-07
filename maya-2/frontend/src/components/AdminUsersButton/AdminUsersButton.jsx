import React from "react";
import { FaUsersCog } from "react-icons/fa";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import "./AdminUsersButton.css";
import { useAdmin } from "../../context/AdminContext";

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
      {/* Sidebar button */}
      {!renderContent && (
        <button
          className={`admin-nav-item ${isActive ? "active" : ""}`}
          onClick={() => setActiveSection("users")}
        >
          <span className="admin-nav-icon">
            <FaUsersCog />
          </span>
          <span className="admin-nav-label">User Management</span>
        </button>
      )}

      {/* Main content */}
      {renderContent && isActive && (
        <div className="admin-users">
          <div className="section-content">
            <div className="section-header">
              <h2>User Management</h2>
              <button
                className="admin-users-add-btn"
                onClick={() => openModal("createUser")}
              >
                <span className="btn-icon">
                  <MdAdd />
                </span>
                Add New User
              </button>
            </div>
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{user.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon edit"
                            onClick={() => openModal("editUser", user)}
                            title="Edit User"
                          >
                            <MdEdit color="blue" />
                          </button>
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
                  ))}
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
