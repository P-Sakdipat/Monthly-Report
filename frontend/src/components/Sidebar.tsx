'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Highly legible, reusable Navigation Sidebar with dynamic Admin permissions routing.
 */
const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = 
    user && 
    (String(user.role_level).toLowerCase().trim() === 'admin' || 
     String(user.role_level).toLowerCase().trim() === 'superadmin');

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-logo">MD_monthly</div>
      
      <nav className="sidebar-menu">
        {/* Main Dashboard / Form Link */}
        <div 
          className={`menu-item ${pathname === '/' ? 'active' : ''}`}
          onClick={() => router.push('/')}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>กรอกรายงานประจำเดือน</span>
        </div>
        
        {/* Admin Link (Conditional) */}
        {isAdmin && (
          <div 
            className={`menu-item ${pathname.startsWith('/admin') ? 'active' : ''}`}
            onClick={() => router.push('/admin')}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>จัดการผู้ใช้งาน</span>
          </div>
        )}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-block">
          <span className="user-block-name">{user?.username}</span>
          <span className="user-block-dept">แผนก: {user?.department || 'ไม่ระบุ'}</span>
        </div>
        
        <button onClick={logout} className="btn-logout">
          ออกจากระบบ (Sign Out)
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
