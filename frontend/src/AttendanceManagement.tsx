import React, { useState, useEffect } from "react";
import { Attendance, Employee } from "./types";
import {
  checkInWithTime,
  checkOut,
  getTodayAttendance,
  getAllEmployees,
  getAttendance,
} from "./api";
import "./AttendanceManagement.css";

interface AttendanceManagementProps {
  isActive: boolean;
}

function AttendanceManagement({ isActive }: AttendanceManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"today" | "filtered">("today");
  const [useManualTime, setUseManualTime] = useState(false);
  const [manualCheckInTime, setManualCheckInTime] = useState<string>(
    new Date().toISOString().split('.')[0]
  );

  useEffect(() => {
    if (isActive) {
      loadEmployees();
      loadTodayAttendance();
    }
  }, [isActive]);

  const loadEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err: any) {
      console.error("Failed to load employees:", err);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTodayAttendance();
      setAttendance(data);
      setViewMode("today");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredAttendance = async () => {
    if (!filterDate) {
      setError("Please select a date");
      return;
    }

    try {
      setLoading(true);
      const data = await getAttendance(undefined, filterDate);
      setAttendance(data);
      setViewMode("filtered");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      setError("Please select an employee");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const checkInTimeToUse = useManualTime ? manualCheckInTime : undefined;
      const result = await checkInWithTime(selectedEmployeeId, checkInTimeToUse);
      setSuccess(result.message);
      setSelectedEmployeeId(null);
      setUseManualTime(false);
      setManualCheckInTime(new Date().toISOString().split('.')[0]);
      await loadTodayAttendance();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId: number) => {
    if (!window.confirm("Confirm check-out?")) return;

    try {
      setLoading(true);
      setError("");
      const result = await checkOut(attendanceId);
      setSuccess(result.message);
      await loadTodayAttendance();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const presentCount = attendance.filter((a) => a.check_out).length;
    const checkedInCount = attendance.filter((a) => !a.check_out).length;
    const totalHours = attendance.reduce(
      (sum, a) => sum + (a.duration_minutes || 0),
      0
    );

    return { presentCount, checkedInCount, totalHours };
  };

  const stats = getAttendanceStats();
  const checkedInEmployees = attendance.filter((a) => !a.check_out);

  if (!isActive) return null;

  return (
    <div className="attendance-management">
      <div className="attendance-container">
        {/* Check-in Section */}
        <div className="attendance-form-section">
          <h2>👤 Employee Check-In</h2>

          <div className="check-in-form">
            <div className="form-group">
              <label>Select Employee</label>
              <select
                value={selectedEmployeeId || ""}
                onChange={(e) =>
                  setSelectedEmployeeId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                disabled={loading}
              >
                <option value="">-- Select an employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Check-in Time */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={useManualTime}
                  onChange={(e) => setUseManualTime(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Manual Check-in Time
              </label>
            </div>

            {useManualTime && (
              <div className="form-group">
                <label>Check-in Time</label>
                <input
                  type="datetime-local"
                  value={manualCheckInTime}
                  onChange={(e) => setManualCheckInTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button
              className="btn btn-primary btn-checkin"
              onClick={handleCheckIn}
              disabled={loading || !selectedEmployeeId}
            >
              {loading ? "Processing..." : "✓ Check-In"}
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Checked In Today</div>
              <div className="stat-value">{checkedInEmployees.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed Shifts</div>
              <div className="stat-value">{stats.presentCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Employees</div>
              <div className="stat-value">{employees.length}</div>
            </div>
          </div>
        </div>

        {/* Attendance Records Section */}
        <div className="attendance-records-section">
          <h2>📅 Attendance Records</h2>

          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by Date</label>
              <div className="filter-row">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="btn btn-primary"
                  onClick={loadFilteredAttendance}
                  disabled={loading}
                >
                  Filter
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={loadTodayAttendance}
                  disabled={loading}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Currently Checked-In */}
          {viewMode === "today" && checkedInEmployees.length > 0 && (
            <div className="currently-checkedin">
              <h3>Currently Checked-In</h3>
              <div className="employees-checkedin-grid">
                {checkedInEmployees.map((record) => (
                  <div key={record.id} className="checkedin-card">
                    <div className="checkedin-info">
                      <h4>{record.employee_name}</h4>
                      <p className="checkin-time">
                        Check-In: {new Date(record.check_in).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      className="btn btn-small btn-checkout"
                      onClick={() => handleCheckOut(record.id)}
                      disabled={loading}
                    >
                      Check-Out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="attendance-table-container">
            {loading && attendance.length === 0 && <p>Loading records...</p>}
            {attendance.length === 0 && !loading && (
              <p className="no-data">No attendance records found</p>
            )}

            {attendance.length > 0 && (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="name-cell">{record.employee_name}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td className="time-cell">
                        {new Date(record.check_in).toLocaleTimeString()}
                      </td>
                      <td className="time-cell">
                        {record.check_out
                          ? new Date(record.check_out).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="duration-cell">
                        {record.duration_minutes
                          ? `${Math.floor(record.duration_minutes / 60)}h ${
                              record.duration_minutes % 60
                            }m`
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            record.check_out ? "completed" : "present"
                          }`}
                        >
                          {record.check_out ? "✓ Completed" : "● Present"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceManagement;
