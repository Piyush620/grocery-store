import React, { useState, useEffect } from "react";
import { Employee } from "./types";
import {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} from "./api";
import "./EmployeeManagement.css";

interface EmployeeManagementProps {
  isActive: boolean;
}

function EmployeeManagement({ isActive }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    salary: "",
    hire_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isActive) {
      loadEmployees();
    }
  }, [isActive]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      setEmployees(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.position) {
      setError("Name and position are required");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updateEmployee(editingId, {
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          position: formData.position,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
        });
        setSuccess("✓ Employee updated successfully");
      } else {
        await addEmployee({
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          position: formData.position,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          hire_date: formData.hire_date,
          status: "active",
        });
        setSuccess("✓ Employee added successfully");
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        position: "",
        salary: "",
        hire_date: new Date().toISOString().split("T")[0],
      });
      setEditingId(null);
      await loadEmployees();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      phone: employee.phone || "",
      email: employee.email || "",
      position: employee.position,
      salary: employee.salary.toString(),
      hire_date: employee.hire_date,
    });
    setEditingId(employee.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteEmployee(id);
      setSuccess("✓ Employee removed");
      await loadEmployees();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      position: "",
      salary: "",
      hire_date: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
  };

  if (!isActive) return null;

  return (
    <div className="employee-management">
      <div className="employee-container">
        {/* Form Section */}
        <div className="employee-form-section">
          <h2>{editingId ? "Edit Employee" : "Add New Employee"}</h2>
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Employee name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Position *</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g., Manager, Cashier"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Monthly salary"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-buttons">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Processing..." : editingId ? "Update" : "Add Employee"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Employees List Section */}
        <div className="employee-list-section">
          <h2>Employees ({employees.length})</h2>
          {loading && employees.length === 0 && <p>Loading employees...</p>}
          {employees.length === 0 && !loading && (
            <p className="no-data">No employees found</p>
          )}
          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-card-header">
                  <h3>{employee.name}</h3>
                  <span className="position-badge">{employee.position}</span>
                </div>
                <div className="employee-card-body">
                  {employee.phone && (
                    <p>
                      <strong>Phone:</strong> {employee.phone}
                    </p>
                  )}
                  {employee.email && (
                    <p>
                      <strong>Email:</strong> {employee.email}
                    </p>
                  )}
                  {employee.salary > 0 && (
                    <p>
                      <strong>Salary:</strong> ₹{employee.salary.toLocaleString()}
                    </p>
                  )}
                  <p>
                    <strong>Hire Date:</strong> {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="employee-card-actions">
                  <button
                    className="btn btn-small btn-edit"
                    onClick={() => handleEdit(employee)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-delete"
                    onClick={() => handleDelete(employee.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeManagement;
