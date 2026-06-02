'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Premium Login Page with custom HSL Dark Glow backgrounds and high-fidelity Glassmorphic cards.
 */
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check validation locally
    if (!username || !password) {
      triggerError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Call Context login operation (queries db backend)
    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      triggerError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  /**
   * Sets error state and triggers micro-animation vibration/shake on form card
   */
  const triggerError = (msg: string) => {
    setError(msg);
    setShouldShake(true);
    // Remove class after animation concludes
    setTimeout(() => {
      setShouldShake(false);
    }, 450);
  };

  return (
    <div className="login-page-container">
      {/* Background ambient light orbs */}
      <div className="ambient-glow-wrapper">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
      </div>

      <div className={`login-glass-card ${shouldShake ? 'shake-element' : ''}`}>
        <div className="login-header-group">
          <span className="login-title-badge">Database Access Portal</span>
          <h2 className="login-title">MD_monthly</h2>
          <p className="login-subtitle">ระบบวิเคราะห์และรายงานข้อมูลเชิงกลยุทธ์ส่วนผู้บริหาร</p>
        </div>

        {error && (
          <div className="error-alert-banner">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-field-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="input-styled"
              placeholder="กรอกชื่อผู้ใช้ (username)..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="input-field-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="input-styled"
              placeholder="กรอกรหัสผ่าน (password)..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="skeleton-pulse-ring" style={{ width: '18px', height: '18px', margin: '0', borderWidth: '2px' }} viewBox="0 0 24 24"></svg>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ (Sign In)</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
