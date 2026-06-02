'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

// --- FIXED DEPARTMENT KPI CONFIGURATION ---
const DEPT_KPIS: Record<string, string[]> = {
  aii: [
    "อัตราความถูกต้องของโมเดล AI (AI Model Accuracy Rate)",
    "เวลาตอบสนองของ API เฉลี่ยต่ำกว่า 200ms (API Response Time)",
    "จำนวนผู้ใช้งานประจำสัปดาห์ (Weekly Active Users)",
    "เสถียรภาพการทำงานของระบบเซิร์ฟเวอร์ (System Uptime)"
  ],
  it: [
    "เสถียรภาพระบบเครือข่ายสารสนเทศ (Network Availability)",
    "อัตราความสำเร็จในการแก้ไขปัญหาของ IT Helpdesk",
    "การปรับปรุงความปลอดภัยเซิร์ฟเวอร์ตามกำหนด (Security Compliance)"
  ],
  finance: [
    "ความคลาดเคลื่อนงบประมาณรายจ่าย (Operating Budget Variance)",
    "ความแม่นยำในการคาดการณ์กระแสเงินสด (Cash Flow Forecasting)",
    "ระยะเวลาเฉลี่ยการดำเนินการใบแจ้งหนี้ (Invoice Cycle Time)"
  ],
  operation: [
    "อัตราการลดระยะเวลาทำงานในกระบวนการผลิต (Cycle Time Reduction)",
    "อัตราการใช้ทรัพยากรสำนักงานส่วนกลาง (Resource Utilization)",
    "การตรวจสอบบำรุงรักษาเครื่องมือตามรอบแผนงาน (Maintenance Compliance)"
  ],
  marketing: [
    "อัตราการมีส่วนร่วมในช่องทางออนไลน์ (Online Engagement Rate)",
    "จำนวนรายชื่อผู้สนใจติดต่อรายใหม่ (Lead Generation Target)",
    "อัตราการลดต้นทุนค่าโฆษณาต่อลูกค้าใหม่ (Ad Optimization Rate)"
  ]
};

// Helper to extract numbers out of strings (strips spaces, commas, percentage symbols)
const parseKpiNumber = (val: string): number | null => {
  if (!val) return null;
  const cleaned = val.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Helper to calculate status colors
const getKpiStatus = (targetStr: string, actualStr: string) => {
  const target = parseKpiNumber(targetStr);
  const actual = parseKpiNumber(actualStr);

  if (target === null || actual === null) {
    return { color: '#64748B', text: 'รอข้อมูล', bg: '#F1F5F9' }; // gray
  }

  if (actual > target) {
    return { color: '#059669', text: 'ดีกว่าเป้าหมาย (จุดเขียว)', bg: '#D1FAE5' }; // green
  }
  if (actual === target) {
    return { color: '#D97706', text: 'ตามเป้าหมาย (จุดเหลือง)', bg: '#FEF3C7' }; // yellow
  }
  return { color: '#DC2626', text: 'ต่ำกว่าเป้าหมาย (จุดแดง)', bg: '#FEE2E2' }; // red
};

/**
 * Premium, High-Contrast White-Themed Monthly Report Submission Form.
 * Tailored for senior executives with large fonts and responsive, robust grid elements.
 */
const MonthlyReportForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-calculated current month in English + Year
  const [autoMonth, setAutoMonth] = useState('');

  useEffect(() => {
    const date = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    setAutoMonth(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
  }, []);

  // --- COMPREHENSIVE FORM STATE DIRECTLY ALIGNED WITH ERD ---
  const [opportunities, setOpportunities] = useState<string[]>(['']);
  const [risks, setRisks] = useState<string[]>(['']);
  const [insights, setInsights] = useState<string[]>(['']);

  const [kpis, setKpis] = useState<Array<{ kpi_name: string; kpi_target: string; kpi_actual: string; last_month_status: string }>>([]);

  // Auto-fetch fixed KPIs and previous month's actual performance from the SQL Server backend
  useEffect(() => {
    const fetchKpiTemplates = async () => {
      if (user && user.department) {
        try {
          const res = await api.get(`/reports/kpis/init?dept=${user.department}`);
          if (res.data.success && res.data.kpis) {
            setKpis(res.data.kpis.map((k: any) => ({
              kpi_name: k.kpi_name,
              kpi_target: '',
              kpi_actual: '',
              last_month_status: k.last_month_status || 'ไม่มีข้อมูล'
            })));
          }
        } catch (err) {
          console.error('Failed to fetch fixed KPI templates from backend:', err);
          // Fallback if API fails
          setKpis([
            { kpi_name: 'ดัชนีชี้วัดประสิทธิภาพแผนกข้อ 1', kpi_target: '', kpi_actual: '', last_month_status: 'ไม่มีข้อมูล' },
            { kpi_name: 'ดัชนีชี้วัดประสิทธิภาพแผนกข้อ 2', kpi_target: '', kpi_actual: '', last_month_status: 'ไม่มีข้อมูล' }
          ]);
        }
      }
    };

    fetchKpiTemplates();
  }, [user]);

  const [actionPlans, setActionPlans] = useState<Array<{ action_detail: string; action_owner: string; timeline: string }>>([
    { action_detail: '', action_owner: '', timeline: '' }
  ]);

  const [decisions, setDecisions] = useState<Array<{ decision_topic: string; md_status: string; md_comment: string }>>([
    { decision_topic: '', md_status: 'Approved', md_comment: '' }
  ]);

  const [followups, setFollowups] = useState<Array<{ task_type: string; task_detail: string; task_status: string }>>([
    { task_type: 'Action', task_detail: '', task_status: 'Pending' }
  ]);

  const [issues, setIssues] = useState<Array<{ issue_topic: string; issue_cause: string; impact: string; impacts: string[] }>>([
    { issue_topic: '', issue_cause: '', impact: '', impacts: [''] }
  ]);

  // --- DYNAMIC HANDLERS (Opportunities, Risks, Insights) ---
  const handleStringListChange = (index: number, val: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    const updated = [...list];
    updated[index] = val;
    setList(updated);
  };

  const addStringRow = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList([...list, '']);
  };

  const removeStringRow = (index: number, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.length === 1) return;
    const updated = list.filter((_, idx) => idx !== index);
    setList(updated);
  };

  // --- DYNAMIC KPI HANDLERS ---
  const handleKpiChange = (index: number, field: string, val: string) => {
    const updated = [...kpis];
    updated[index] = { ...updated[index], [field]: val };
    setKpis(updated);
  };

  // --- DYNAMIC ACTION PLAN HANDLERS ---
  const handleActionPlanChange = (index: number, field: string, val: string) => {
    const updated = [...actionPlans];
    updated[index] = { ...updated[index], [field]: val };
    setActionPlans(updated);
  };

  // --- DYNAMIC DECISION HANDLERS ---
  const handleDecisionChange = (index: number, field: string, val: string) => {
    const updated = [...decisions];
    updated[index] = { ...updated[index], [field]: val };
    setDecisions(updated);
  };

  // --- DYNAMIC FOLLOWUP HANDLERS ---
  const handleFollowupChange = (index: number, field: string, val: string) => {
    const updated = [...followups];
    updated[index] = { ...updated[index], [field]: val };
    setFollowups(updated);
  };

  // --- DYNAMIC KEY ISSUES AND NESTED IMPACTS ---
  const handleIssueChange = (index: number, field: string, val: string) => {
    const updated = [...issues];
    updated[index] = { ...updated[index], [field]: val };
    setIssues(updated);
  };

  const handleNestedImpactChange = (issueIdx: number, impactIdx: number, val: string) => {
    const updated = [...issues];
    updated[issueIdx].impacts[impactIdx] = val;
    setIssues(updated);
  };

  const addNestedImpact = (issueIdx: number) => {
    const updated = [...issues];
    updated[issueIdx].impacts.push('');
    setIssues(updated);
  };

  const removeNestedImpact = (issueIdx: number, impactIdx: number) => {
    const updated = [...issues];
    if (updated[issueIdx].impacts.length === 1) return;
    updated[issueIdx].impacts = updated[issueIdx].impacts.filter((_, idx) => idx !== impactIdx);
    setIssues(updated);
  };

  // --- FORM SUBMIT TRIGGER ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Prepare clean request payload filtering out empty rows
    const payload = {
      opportunities: opportunities.filter(o => o.trim() !== ''),
      risks: risks.filter(r => r.trim() !== ''),
      insights: insights.filter(i => i.trim() !== ''),
      kpis: kpis.filter(k => k.kpi_name.trim() !== ''),
      actionPlans: actionPlans.filter(a => a.action_detail.trim() !== ''),
      decisions: decisions.filter(d => d.decision_topic.trim() !== ''),
      followups: followups.filter(f => f.task_detail.trim() !== ''),
      issues: issues
        .filter(i => i.issue_topic.trim() !== '')
        .map(i => ({
          ...i,
          impacts: i.impacts.filter(imp => imp.trim() !== '')
        }))
    };

    try {
      const res = await api.post('/reports', payload);
      if (res.data.success) {
        setSuccessMsg('🎉 บันทึกข้อมูลรายงานส่วนผู้บริหาร (Monthly Report) เรียบร้อยแล้ว!');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reset form inputs
        setOpportunities(['']);
        setRisks(['']);
        setInsights(['']);
        setKpis([{ kpi_name: '', kpi_target: '', kpi_actual: '', last_month_status: '' }]);
        setActionPlans([{ action_detail: '', action_owner: '', timeline: '' }]);
        setDecisions([{ decision_topic: '', md_status: 'Approved', md_comment: '' }]);
        setFollowups([{ task_type: 'Action', task_detail: '', task_status: 'Pending' }]);
        setIssues([{ issue_topic: '', issue_cause: '', impact: '', impacts: [''] }]);
      } else {
        setErrorMsg(res.data.message || 'บันทึกข้อมูลล้มเหลว');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลปลายทาง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="dashboard-shell">
        <Sidebar />

        <main className="dashboard-main-content">
          <header className="dashboard-top-header">
            <div>
              <h1 className="header-greeting-title">แบบฟอร์มกรอกข้อมูลรายเดือน 📝</h1>
              <p className="header-subinfo">บันทึกแผนงาน อุปสรรค และ KPI ประจำรอบการรายงานส่วนผู้บริหาร</p>
            </div>
            <div>
              <span className="role-pill">
                แผนก: {user?.department || 'ไม่ระบุ'}
              </span>
            </div>
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

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* --- SECTION 1: MASTER INFO (AUTO FILLED) --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">ข้อมูลทั่วไปของรายงาน (ระบบเลือกให้โดยอัตโนมัติ)</h3>
              </div>
              <div className="form-grid-2">
                <div className="input-field-group">
                  <label className="input-label">ฝ่าย / แผนกผู้รายงาน (Department)</label>
                  <input type="text" className="input-styled" value={user?.department || 'ไม่ระบุ'} disabled />
                </div>
                <div className="input-field-group">
                  <label className="input-label">เดือนรอบรายงาน (Report Month)</label>
                  <input type="text" className="input-styled" value={autoMonth} disabled />
                </div>
              </div>
            </div>

            {/* --- SECTION 2: KPI PERFORMANCE (FIXED & HIGH CONTRAST STATUS) --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">1. ดัชนีชี้วัดประสิทธิภาพ (KPI Performance - กำหนดเฉพาะของแผนกคุณ)</h3>
                <p className="section-subheading">กรอกข้อมูลตัวเลขเป้าหมาย ผลงานจริง และสถานะตัวชี้วัด โดยระบบจะตรวจสอบผลสำเร็จและแสดงผลไฟสีเป็นสถานะปัจจุบันให้ทันที</p>
              </div>

              <div className="dynamic-list-container">
                {kpis.map((kpi, idx) => {
                  const status = getKpiStatus(kpi.kpi_target, kpi.kpi_actual);
                  const isDeptKpiFixed = user && DEPT_KPIS[String(user.department).toLowerCase().trim()]?.length > 0;

                  return (
                    <div key={idx} className="dynamic-row-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '12px', alignItems: 'center' }}>
                      {/* KPI Name is read-only for mapped departments to guarantee fixity */}
                      <div>
                        <span className="input-label" style={{ fontSize: '15px', color: '#475569', marginBottom: '4px' }}>หัวข้อตัวชี้วัด</span>
                        <input
                          type="text"
                          className="input-styled"
                          value={kpi.kpi_name}
                          disabled={isDeptKpiFixed}
                          onChange={(e) => handleKpiChange(idx, 'kpi_name', e.target.value)}
                          style={{ fontWeight: 700, backgroundColor: isDeptKpiFixed ? '#F8FAFC' : '#FFFFFF' }}
                        />
                      </div>

                      <div>
                        <span className="input-label" style={{ fontSize: '15px', color: '#475569', marginBottom: '4px' }}>เป้าหมาย (Target)</span>
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="เช่น 90%"
                          value={kpi.kpi_target}
                          onChange={(e) => handleKpiChange(idx, 'kpi_target', e.target.value)}
                        />
                      </div>

                      <div>
                        <span className="input-label" style={{ fontSize: '15px', color: '#475569', marginBottom: '4px' }}>ผลงานจริง (Actual)</span>
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="เช่น 95%"
                          value={kpi.kpi_actual}
                          onChange={(e) => handleKpiChange(idx, 'kpi_actual', e.target.value)}
                        />
                      </div>

                      <div>
                        <span className="input-label" style={{ fontSize: '15px', color: '#475569', marginBottom: '4px' }}>สถานะเฉดสี</span>
                        <div
                          style={{
                            height: '54px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            backgroundColor: status.bg,
                            border: `2px solid ${status.color}`,
                            fontWeight: 700,
                            color: status.color,
                            fontSize: '15px',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>●</span>
                          <span>{status.text.split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Automated Last Month Status Badge derived from database */}
                      <div>
                        <span className="input-label" style={{ fontSize: '15px', color: '#475569', marginBottom: '4px' }}>สถานะเฉดสีเดือนที่แล้ว (Auto)</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div
                            style={{
                              height: '54px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              backgroundColor:
                                kpi.last_month_status === 'เขียว' ? '#D1FAE5' :
                                  kpi.last_month_status === 'เหลือง' ? '#FEF3C7' :
                                    kpi.last_month_status === 'แดง' ? '#FEE2E2' : '#F1F5F9',
                              border: `2px solid ${kpi.last_month_status === 'เขียว' ? '#059669' :
                                kpi.last_month_status === 'เหลือง' ? '#D97706' :
                                  kpi.last_month_status === 'แดง' ? '#DC2626' : '#94A3B8'
                                }`,
                              fontWeight: 700,
                              color:
                                kpi.last_month_status === 'เขียว' ? '#059669' :
                                  kpi.last_month_status === 'เหลือง' ? '#D97706' :
                                    kpi.last_month_status === 'แดง' ? '#DC2626' : '#64748B',
                              fontSize: '15px',
                              width: '100%',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>●</span>
                            <span>{kpi.last_month_status || 'ไม่มีข้อมูล'}</span>
                          </div>
                          {!isDeptKpiFixed && (
                            <button type="button" className="btn-remove-row" style={{ height: '54px' }} onClick={() => {
                              if (kpis.length === 1) return;
                              setKpis(kpis.filter((_, i) => i !== idx));
                            }}>ลบ</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!user || !DEPT_KPIS[String(user.department).toLowerCase().trim()] && (
                <button type="button" className="btn-add-item" onClick={() => setKpis([...kpis, { kpi_name: '', kpi_target: '', kpi_actual: '', last_month_status: '' }])}>+ เพิ่มแถว KPI</button>
              )}
            </div>



            {/* --- SECTION 3: KEY INSIGHTS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading"> 2. ข้อมูลวิเคราะห์เชิงลึก (Key Insights)</h3>
                <p className="section-subheading">ประเด็นสำคัญจากการสำรวจข้อมูลและการทำงาน</p>
              </div>

              <div className="dynamic-list-container">
                {insights.map((ins, idx) => (
                  <div key={idx} className="dynamic-row-card">
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="กรอกประเด็นวิเคราะห์วิจัย..."
                      value={ins}
                      onChange={(e) => handleStringListChange(idx, e.target.value, insights, setInsights)}
                    />
                    <button type="button" className="btn-remove-row" onClick={() => removeStringRow(idx, insights, setInsights)}>ลบ</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-item" onClick={() => addStringRow(insights, setInsights)}>+ เพิ่มหัวข้อวิเคราะห์เชิงลึก</button>
            </div>

            {/* --- SECTION 4: KEY ISSUES & nested IMPACTS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">3. ปัญหาหลักที่พบและผลกระทบ (Key Issues & Impacts)</h3>
                <p className="section-subheading">หัวข้อปัญหาหลัก สาเหตุ และรายชื่อผลกระทบที่อาจเกิดตามมา</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {issues.map((issue, idx) => (
                  <div key={idx} style={{ border: '2px solid #E2E8F0', padding: '24px', borderRadius: '16px', backgroundColor: '#F8FAFC' }}>
                    <div className="form-grid-2">
                      <div className="input-field-group">
                        <label className="input-label">ประเด็นปัญหา (Issue Topic)</label>
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="กรอกชื่อหัวข้ออุปสรรค..."
                          value={issue.issue_topic}
                          onChange={(e) => handleIssueChange(idx, 'issue_topic', e.target.value)}
                        />
                      </div>
                      <div className="input-field-group">
                        <label className="input-label">สาเหตุของปัญหา (Issue Cause)</label>
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="กรอกสาเหตุเหตุการณ์..."
                          value={issue.issue_cause}
                          onChange={(e) => handleIssueChange(idx, 'issue_cause', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="input-field-group">
                      <label className="input-label">ผลกระทบภาพรวม (Overall Impact)</label>
                      <input
                        type="text"
                        className="input-styled"
                        placeholder="กรอกผลกระทบภาพรวม..."
                        value={issue.impact}
                        onChange={(e) => handleIssueChange(idx, 'impact', e.target.value)}
                      />
                    </div>

                    {/* Nested bullet impacts */}
                    <div style={{ marginLeft: '24px', marginTop: '12px' }}>
                      <label className="input-label" style={{ fontSize: '16px' }}>รายละเอียดผลกระทบย่อย (Impact Bullet Points)</label>
                      <div className="dynamic-list-container">
                        {issue.impacts.map((bullet, bulletIdx) => (
                          <div key={bulletIdx} className="dynamic-row-card">
                            <input
                              type="text"
                              className="input-styled"
                              placeholder="กรอกรายชื่อข้อความผลกระทบ..."
                              value={bullet}
                              onChange={(e) => handleNestedImpactChange(idx, bulletIdx, e.target.value)}
                            />
                            <button type="button" className="btn-remove-row" onClick={() => removeNestedImpact(idx, bulletIdx)}>ลบ</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="btn-add-item" style={{ width: 'auto', borderStyle: 'solid', borderWidth: '1px' }} onClick={() => addNestedImpact(idx)}>+ เพิ่มแถวผลกระทบย่อย</button>
                    </div>

                    <button type="button" className="btn-logout" style={{ marginTop: '20px', width: 'auto' }} onClick={() => {
                      if (issues.length === 1) return;
                      setIssues(issues.filter((_, i) => i !== idx));
                    }}>ลบหัวข้อปัญหานี้ออก</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-item" onClick={() => setIssues([...issues, { issue_topic: '', issue_cause: '', impact: '', impacts: [''] }])}>+ เพิ่มหัวข้ออุปสรรคชุดใหม่</button>
            </div>

            {/* --- SECTION 5: OPPORTUNITIES & RISKS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">โอกาสทางธุรกิจและความเสี่ยง (Opportunities & Risks)</h3>
                <p className="section-subheading">กรอกแผนงานหรือสถานการณ์โอกาสและความเสี่ยงรอบเดือนนี้</p>
              </div>

              <div className="form-grid-2">

                <div>
                  <label className="input-label">4. ความเสี่ยงที่ต้องเฝ้าระวัง (Risks)</label>
                  <div className="dynamic-list-container">
                    {risks.map((risk, idx) => (
                      <div key={idx} className="dynamic-row-card">
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="กรอกความเสี่ยงรอบเดือน..."
                          value={risk}
                          onChange={(e) => handleStringListChange(idx, e.target.value, risks, setRisks)}
                        />
                        <button type="button" className="btn-remove-row" onClick={() => removeStringRow(idx, risks, setRisks)}>ลบ</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-add-item" onClick={() => addStringRow(risks, setRisks)}>+ เพิ่มแถวความเสี่ยง</button>
                </div>

                <div>
                  <label className="input-label">5. โอกาสที่สำคัญ (Opportunities)</label>
                  <div className="dynamic-list-container">
                    {opportunities.map((opp, idx) => (
                      <div key={idx} className="dynamic-row-card">
                        <input
                          type="text"
                          className="input-styled"
                          placeholder="กรอกโอกาสใหม่..."
                          value={opp}
                          onChange={(e) => handleStringListChange(idx, e.target.value, opportunities, setOpportunities)}
                        />
                        <button type="button" className="btn-remove-row" onClick={() => removeStringRow(idx, opportunities, setOpportunities)}>ลบ</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-add-item" onClick={() => addStringRow(opportunities, setOpportunities)}>+ เพิ่มแถวโอกาส</button>
                </div>


              </div>
            </div>

            {/* --- SECTION 6: ACTION PLANS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">6. แผนการดำเนินงาน (Action Plans)</h3>
                <p className="section-subheading">งานที่จะดำเนินงานต่อระบุชื่อผู้รับผิดชอบและกำหนดเวลา</p>
              </div>

              <div className="dynamic-list-container">
                {actionPlans.map((plan, idx) => (
                  <div key={idx} className="dynamic-row-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px' }}>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="งานที่จะทำ (Action Detail)..."
                      value={plan.action_detail}
                      onChange={(e) => handleActionPlanChange(idx, 'action_detail', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="ผู้รับผิดชอบ (Owner)..."
                      value={plan.action_owner}
                      onChange={(e) => handleActionPlanChange(idx, 'action_owner', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="ระยะเวลาดำเนินงาน (Timeline)..."
                      value={plan.timeline}
                      onChange={(e) => handleActionPlanChange(idx, 'timeline', e.target.value)}
                    />
                    <button type="button" className="btn-remove-row" style={{ height: '54px' }} onClick={() => {
                      if (actionPlans.length === 1) return;
                      setActionPlans(actionPlans.filter((_, i) => i !== idx));
                    }}>ลบ</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-item" onClick={() => setActionPlans([...actionPlans, { action_detail: '', action_owner: '', timeline: '' }])}>+ เพิ่มแถวแผนการดำเนินงาน</button>
            </div>

            {/* --- SECTION 7: MD DECISIONS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading"> 7. ข้อสรุปและการตัดสินใจ (MD Decisions)</h3>
                <p className="section-subheading">ประเด็นสำคัญที่ขออนุมัติจากส่วนการจัดการ / ความคิดเห็นผู้บริหาร</p>
              </div>

              <div className="dynamic-list-container">
                {decisions.map((dec, idx) => (
                  <div key={idx} className="dynamic-row-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr auto', gap: '12px' }}>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="หัวข้อสรุปการหารือ..."
                      value={dec.decision_topic}
                      onChange={(e) => handleDecisionChange(idx, 'decision_topic', e.target.value)}
                    />
                    <select
                      className="input-styled"
                      value={dec.md_status}
                      onChange={(e) => handleDecisionChange(idx, 'md_status', e.target.value)}
                    >
                      <option value="Approved">Approved (อนุมัติ)</option>
                      <option value="Pending">Pending (อยู่ระหว่างรอ)</option>
                      <option value="Rejected">Rejected (ปฏิเสธ)</option>
                    </select>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="ความคิดเห็นเพิ่มเติม (Comment)..."
                      value={dec.md_comment}
                      onChange={(e) => handleDecisionChange(idx, 'md_comment', e.target.value)}
                    />
                    <button type="button" className="btn-remove-row" style={{ height: '54px' }} onClick={() => {
                      if (decisions.length === 1) return;
                      setDecisions(decisions.filter((_, i) => i !== idx));
                    }}>ลบ</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-item" onClick={() => setDecisions([...decisions, { decision_topic: '', md_status: 'Approved', md_comment: '' }])}>+ เพิ่มหัวข้อหารือเพื่อตัดสินใจ</button>
            </div>

            {/* --- SECTION 8: FOLLOWUPS & TASKS --- */}
            <div className="report-section-glass">
              <div className="section-title-group">
                <h3 className="section-heading">8. งานที่ต้องติดตามต่อ (Followups & Tasks)</h3>
                <p className="section-subheading">รายการประเด็นติดตามต่อเนื่องและสถานะ</p>
              </div>

              <div className="dynamic-list-container">
                {followups.map((fup, idx) => (
                  <div key={idx} className="dynamic-row-card" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr auto', gap: '12px' }}>
                    <select
                      className="input-styled"
                      value={fup.task_type}
                      onChange={(e) => handleFollowupChange(idx, 'task_type', e.target.value)}
                    >
                      <option value="Action">Action (การปฏิบัติงาน)</option>
                      <option value="Follow-up">Follow-up (งานที่ต้องติดตาม)</option>
                      <option value="Critical">Critical (วิกฤต)</option>
                    </select>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="รายละเอียดติดตาม..."
                      value={fup.task_detail}
                      onChange={(e) => handleFollowupChange(idx, 'task_detail', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="สถานะ (Status)..."
                      value={fup.task_status}
                      onChange={(e) => handleFollowupChange(idx, 'task_status', e.target.value)}
                    />
                    <button type="button" className="btn-remove-row" style={{ height: '54px' }} onClick={() => {
                      if (followups.length === 1) return;
                      setFollowups(followups.filter((_, i) => i !== idx));
                    }}>ลบ</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-item" onClick={() => setFollowups([...followups, { task_type: 'Action', task_detail: '', task_status: 'Pending' }])}>+ เพิ่มหัวข้อเฝ้าติดตาม</button>
            </div>

            {/* Submit Trigger Panel */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '40px' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', maxWidth: '400px', fontSize: '20px' }} disabled={loading}>
                {loading ? (
                  <>
                    <svg className="skeleton-pulse-ring" style={{ width: '22px', height: '22px', margin: '0', borderWidth: '3px' }} viewBox="0 0 24 24"></svg>
                    <span>กำลังบันทึกส่งรายงาน...</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>ส่งรายงานส่วนผู้บริหาร (Submit)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MonthlyReportForm;
