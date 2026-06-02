'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface User {
  user_id: number;
  username: string;
  role_level: string | number;
  department: string;
}

/**
 * Premium Admin panel for CRUD user operations.
 * Optimized for older administrators with high-contrast inputs and large action buttons.
 */
const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Overlay Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleLevel, setRoleLevel] = useState('Staff');
  const [department, setDepartment] = useState('');

  // Hydrate users list from backend SQL Server
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาด: ไม่สามารถดึงรายชื่อผู้ใช้จากระบบฐานข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if current user is admin
  const isAuthorizedAdmin = 
    currentUser && 
    (String(currentUser.role_level).toLowerCase().trim() === 'admin' || 
     String(currentUser.role_level).toLowerCase().trim() === 'superadmin');

  // Trigger notification helpers
  const showNotice = (msg: string, isSuccess: boolean = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setErrorMsg(null);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4500);
  };

  // --- CRUD 1: CREATE USER ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !roleLevel || !department) {
      showNotice('กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วนในทุกๆ ช่อง', false);
      return;
    }

    try {
      const res = await api.post('/users', {
        username,
        password,
        role_level: roleLevel,
        department
      });

      if (res.data.success) {
        showNotice('🎉 เพิ่มผู้ใช้งานใหม่เรียบร้อยแล้ว!');
        setShowAddModal(false);
        // Clear fields
        setUsername('');
        setPassword('');
        setRoleLevel('Staff');
        setDepartment('');
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      showNotice(err.response?.data?.message || 'ไม่สามารถสร้างผู้ใช้รายนี้ได้', false);
    }
  };

  // --- CRUD 2: UPDATE USER ---
  const handleEditClick = (u: User) => {
    setTargetUser(u);
    setUsername(u.username);
    setPassword(''); // keep blank unless updating
    setRoleLevel(String(u.role_level));
    setDepartment(u.department);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!username || !roleLevel || !department) {
      showNotice('กรุณากรอกข้อมูลหลักให้ครบถ้วน', false);
      return;
    }

    try {
      const res = await api.put(`/users/${targetUser.user_id}`, {
        username,
        password, // optional password update
        role_level: roleLevel,
        department
      });

      if (res.data.success) {
        showNotice('🎉 แก้ไขข้อมูลผู้ใช้เสร็จสิ้น!');
        setShowEditModal(false);
        setTargetUser(null);
        setUsername('');
        setPassword('');
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      showNotice(err.response?.data?.message || 'ไม่สามารถแก้ไขข้อมูลได้', false);
    }
  };

  // --- CRUD 3: DELETE USER ---
  const handleDeleteClick = async (u: User) => {
    if (currentUser?.user_id === u.user_id) {
      showNotice('❌ แจ้งเตือนความปลอดภัย: คุณไม่สามารถลบบัญชีแอดมินของตนเองขณะกำลังใช้งานได้!', false);
      return;
    }

    const confirm = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งาน "${u.username}" ออกจากระบบถาวร?`);
    if (!confirm) return;

    try {
      const res = await api.delete(`/users/${u.user_id}`);
      if (res.data.success) {
        showNotice('🎉 ลบผู้ใช้งานออกจากระบบเรียบร้อยแล้ว!');
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      showNotice(err.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้', false);
    }
  };

  if (!isAuthorizedAdmin) {
    return (
      <ProtectedRoute>
        <div className="dashboard-shell">
          <Sidebar />
          <main className="dashboard-main-content">
            <div className="error-alert-banner">
              <span>❌ ขออภัย: หน้านี้จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard-shell">
        <Sidebar />

        <main className="dashboard-main-content">
          <header className="dashboard-top-header">
            <div>
              <h1 className="header-greeting-title">จัดการผู้ใช้งานระบบ (User Management) 👥</h1>
              <p className="header-subinfo">เพิ่ม แก้ไข หรือลบบัญชีผู้ใช้ในระบบรายงาน MD_monthly</p>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={() => {
                setUsername('');
                setPassword('');
                setRoleLevel('Staff');
                setDepartment('');
                setShowAddModal(true);
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </header>

          {successMsg && (
            <div className="error-alert-banner" style={{ backgroundColor: '#D1FAE5', borderColor: '#10B981', color: '#065F46' }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="error-alert-banner">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Data Table Grid */}
          <section className="report-section-glass" style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="skeleton-pulse-ring" style={{ width: '40px', height: '40px' }}></div>
                <p style={{ marginTop: '12px', color: '#64748B', fontWeight: 600 }}>กำลังดึงข้อมูลบัญชีผู้ใช้ล่าสุด...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>ลำดับไอดี</th>
                      <th>ชื่อบัญชีผู้ใช้ (Username)</th>
                      <th>ระดับสิทธิ์ (Role)</th>
                      <th>แผนกรับผิดชอบ</th>
                      <th>ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id}>
                        <td>#{u.user_id}</td>
                        <td style={{ fontWeight: 700 }}>{u.username}</td>
                        <td>
                          <span className={`role-pill ${String(u.role_level).toLowerCase() === 'admin' ? 'role-super' : ''}`}>
                            {u.role_level}
                          </span>
                        </td>
                        <td style={{ textTransform: 'uppercase', fontWeight: 600, color: '#4F46E5' }}>{u.department}</td>
                        <td>
                          <div className="table-action-group">
                            <button className="btn-table-edit" onClick={() => handleEditClick(u)}>แก้ไข</button>
                            <button className="btn-table-delete" onClick={() => handleDeleteClick(u)}>ลบ</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* --- DIALOG MODAL 1: ADD USER --- */}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal-content-card">
                <div className="modal-header">
                  <h3 className="modal-title">➕ เพิ่มผู้ใช้งานใหม่เข้าระบบ</h3>
                </div>
                
                <form onSubmit={handleAddSubmit}>
                  <div className="input-field-group">
                    <label className="input-label">ชื่อบัญชีผู้ใช้ (Username)</label>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="เช่น operation_sa"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">รหัสผ่านสำหรับล็อกอิน</label>
                    <input
                      type="password"
                      className="input-styled"
                      placeholder="เช่น 12345"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">ระดับสิทธิ์ (Role Level)</label>
                    <select
                      className="input-styled"
                      value={roleLevel}
                      onChange={(e) => setRoleLevel(e.target.value)}
                    >
                      <option value="Staff">Staff (พนักงานทั่วไป)</option>
                      <option value="Supervisor">Supervisor (ผู้จัดการแผนก)</option>
                      <option value="Admin">Admin (ผู้ดูแลระบบหลัก)</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">ฝ่าย / แผนกรับผิดชอบ</label>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="เช่น Aii, IT, Finance"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>ยกเลิก</button>
                    <button type="submit" className="btn-primary">เพิ่มผู้ใช้ทันที</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- DIALOG MODAL 2: EDIT USER --- */}
          {showEditModal && targetUser && (
            <div className="modal-overlay">
              <div className="modal-content-card">
                <div className="modal-header">
                  <h3 className="modal-title">✏️ แก้ไขข้อมูลบัญชี #{targetUser.user_id}</h3>
                </div>
                
                <form onSubmit={handleEditSubmit}>
                  <div className="input-field-group">
                    <label className="input-label">ชื่อบัญชีผู้ใช้ (Username)</label>
                    <input
                      type="text"
                      className="input-styled"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">แก้ไขรหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยนให้เว้นว่างไว้)</label>
                    <input
                      type="password"
                      className="input-styled"
                      placeholder="เปลี่ยนรหัสผ่านผู้ใช้..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">ระดับสิทธิ์ (Role Level)</label>
                    <select
                      className="input-styled"
                      value={roleLevel}
                      onChange={(e) => setRoleLevel(e.target.value)}
                    >
                      <option value="Staff">Staff (พนักงานทั่วไป)</option>
                      <option value="Supervisor">Supervisor (ผู้จัดการแผนก)</option>
                      <option value="Admin">Admin (ผู้ดูแลระบบหลัก)</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label className="input-label">ฝ่าย / แผนกรับผิดชอบ</label>
                    <input
                      type="text"
                      className="input-styled"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => {
                      setShowEditModal(false);
                      setTargetUser(null);
                    }}>ยกเลิก</button>
                    <button type="submit" className="btn-primary">บันทึกข้อมูลแก้ไข</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
};

export default UserManagementPage;
