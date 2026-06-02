import { Response } from 'express';
import { getDbConnection, sql } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Controller to handle monthly report submissions.
 * Wraps insertions into all 10 sub-tables from the ERD under a single atomic SQL Server Transaction.
 * Generates dates dynamically and formats the report month as 'Month Year' in English.
 */
export const submitReport = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Session required.' 
    });
  }

  const { department, username } = req.user;
  
  // Calculate English Month + Year (e.g. "June 2026")
  const date = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const reportMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  // Destructure payloads representing the different tables in the ERD
  const {
    opportunities = [],
    risks = [],
    insights = [],
    kpis = [],
    issues = [],
    actionPlans = [],
    decisions = [],
    followups = []
  } = req.body;

  let transaction: sql.Transaction | null = null;

  try {
    const pool = await getDbConnection();
    transaction = new sql.Transaction(pool);

    // Begin atomic transaction
    await transaction.begin();

    // 1. Insert master record into p1_monthly_reports
    const masterRequest = new sql.Request(transaction);
    const masterResult = await masterRequest
      .input('dept', sql.NVarChar, department || 'General')
      .input('report_month', sql.NVarChar, reportMonth)
      .input('created_by', sql.NVarChar, username)
      .input('created_at', sql.DateTime, new Date())
      .query(`
        INSERT INTO [dbo].[p1_monthly_reports] ([dept], [report_month], [created_by], [created_at])
        VALUES (@dept, @report_month, @created_by, @created_at);
        SELECT SCOPE_IDENTITY() AS report_id;
      `);

    const reportId = masterResult.recordset[0].report_id;

    // 2. Insert Opportunities (p1_report_opportunities)
    for (const opp of opportunities) {
      const oppDetail = typeof opp === 'string' ? opp : opp.opportunity_detail;
      if (!oppDetail || oppDetail.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('detail', sql.NVarChar, oppDetail)
        .query('INSERT INTO [dbo].[p1_report_opportunities] ([report_id], [opportunity_detail]) VALUES (@report_id, @detail)');
    }

    // 3. Insert Risks (p1_report_risks)
    for (const risk of risks) {
      const riskDetail = typeof risk === 'string' ? risk : risk.risk_detail;
      if (!riskDetail || riskDetail.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('detail', sql.NVarChar, riskDetail)
        .query('INSERT INTO [dbo].[p1_report_risks] ([report_id], [risk_detail]) VALUES (@report_id, @detail)');
    }

    // 4. Insert Key Insights (p1_report_key_insights)
    for (const ins of insights) {
      const insDetail = typeof ins === 'string' ? ins : ins.insight_detail;
      if (!insDetail || insDetail.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('detail', sql.NVarChar, insDetail)
        .query('INSERT INTO [dbo].[p1_report_key_insights] ([report_id], [insight_detail]) VALUES (@report_id, @detail)');
    }

    // 5. Insert KPI Performance (p1_report_kpi_performance)
    for (const kpi of kpis) {
      if (!kpi.kpi_name || kpi.kpi_name.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('name', sql.NVarChar, kpi.kpi_name)
        .input('target', sql.NVarChar, kpi.kpi_target || '')
        .input('actual', sql.NVarChar, kpi.kpi_actual || '')
        .input('status', sql.NVarChar, kpi.last_month_status || '')
        .query(`
          INSERT INTO [dbo].[p1_report_kpi_performance] ([report_id], [kpi_name], [kpi_target], [kpi_actual], [last_month_status])
          VALUES (@report_id, @name, @target, @actual, @status)
        `);
    }

    // 6. Insert Action Plans (p1_report_action_plans)
    for (const plan of actionPlans) {
      if (!plan.action_detail || plan.action_detail.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('detail', sql.NVarChar, plan.action_detail)
        .input('owner', sql.NVarChar, plan.action_owner || '')
        .input('timeline', sql.NVarChar, plan.timeline || '')
        .query(`
          INSERT INTO [dbo].[p1_report_action_plans] ([report_id], [action_detail], [action_owner], [timeline])
          VALUES (@report_id, @detail, @owner, @timeline)
        `);
    }

    // 7. Insert MD Decisions (p1_report_md_decisions)
    for (const dec of decisions) {
      if (!dec.decision_topic || dec.decision_topic.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('topic', sql.NVarChar, dec.decision_topic)
        .input('status', sql.NVarChar, dec.md_status || '')
        .input('comment', sql.NVarChar, dec.md_comment || '')
        .query(`
          INSERT INTO [dbo].[p1_report_md_decisions] ([report_id], [decision_topic], [md_status], [md_comment])
          VALUES (@report_id, @topic, @status, @comment)
        `);
    }

    // 8. Insert Followups & Tasks (p1_report_followups_tasks)
    for (const fup of followups) {
      if (!fup.task_detail || fup.task_detail.trim() === '') continue;
      
      const subReq = new sql.Request(transaction);
      await subReq
        .input('report_id', sql.Int, reportId)
        .input('type', sql.NVarChar, fup.task_type || '')
        .input('detail', sql.NVarChar, fup.task_detail)
        .input('status', sql.NVarChar, fup.task_status || '')
        .query(`
          INSERT INTO [dbo].[p1_report_followups_tasks] ([report_id], [task_type], [task_detail], [task_status])
          VALUES (@report_id, @type, @detail, @status)
        `);
    }

    // 9. Insert Key Issues & nested Impacts (p1_report_key_issues & p1_report_issue_impacts)
    for (const issue of issues) {
      if (!issue.issue_topic || issue.issue_topic.trim() === '') continue;
      
      const issueReq = new sql.Request(transaction);
      const issueResult = await issueReq
        .input('report_id', sql.Int, reportId)
        .input('topic', sql.NVarChar, issue.issue_topic)
        .input('cause', sql.NVarChar, issue.issue_cause || '')
        .input('impact', sql.NVarChar, issue.impact || '')
        .query(`
          INSERT INTO [dbo].[p1_report_key_issues] ([report_id], [issue_topic], [issue_cause], [impact])
          VALUES (@report_id, @topic, @cause, @impact);
          SELECT SCOPE_IDENTITY() AS issue_id;
        `);
      
      const issueId = issueResult.recordset[0].issue_id;

      // Insert nested bullet point impacts (p1_report_issue_impacts)
      const bullets = issue.impacts || [];
      for (const bullet of bullets) {
        if (!bullet || String(bullet).trim() === '') continue;
        
        const bulletReq = new sql.Request(transaction);
        await bulletReq
          .input('issue_id', sql.Int, issueId)
          .input('bullet', sql.NVarChar, bullet)
          .query('INSERT INTO [dbo].[p1_report_issue_impacts] ([issue_id], [impact_bullet]) VALUES (@issue_id, @bullet)');
      }
    }

    // Everything succeeded, commit atomically
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Monthly report submitted and archived successfully!',
      report_id: reportId
    });

  } catch (error: any) {
    console.error('Transactional Report Saving Failed, rolling back:', error);
    
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('Transaction successfully rolled back.');
      } catch (rollbackErr) {
        console.error('Transaction rollback failed:', rollbackErr);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Database query failed or connection error.',
      error: error.message
    });
  }
};

/**
 * Endpoint to initialize fixed KPI templates and dynamically pull last month's actual performance status
 * from the database to automatically calculate the "last month status" without prompting the user.
 */
export const getKpisInit = async (req: AuthenticatedRequest, res: Response) => {
  const dept = req.query.dept as string;

  if (!dept) {
    return res.status(400).json({ 
      success: false, 
      message: 'Department parameter is required.' 
    });
  }

  // Pre-defined KPIs for each department fixed by the developer on the backend
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

  const deptKey = dept.toLowerCase().trim();
  const kpiNames = DEPT_KPIS[deptKey] || [];

  // Fallback for custom departments
  if (kpiNames.length === 0) {
    return res.status(200).json({
      success: true,
      kpis: [
        { kpi_name: 'ตัวชี้วัดความสำเร็จแผนก 1', last_month_status: 'ไม่มีข้อมูล' },
        { kpi_name: 'ตัวชี้วัดความสำเร็จแผนก 2', last_month_status: 'ไม่มีข้อมูล' }
      ]
    });
  }

  try {
    const pool = await getDbConnection();
    
    // Find the latest submitted report for this department
    const latestReportResult = await pool.request()
      .input('dept', sql.NVarChar, dept)
      .query(`
        SELECT TOP 1 [report_id] 
        FROM [dbo].[p1_monthly_reports] 
        WHERE [dept] = @dept 
        ORDER BY [created_at] DESC
      `);

    if (latestReportResult.recordset.length === 0) {
      const initializedKpis = kpiNames.map(name => ({
        kpi_name: name,
        last_month_status: 'ไม่มีข้อมูล'
      }));
      return res.status(200).json({ success: true, kpis: initializedKpis });
    }

    const reportId = latestReportResult.recordset[0].report_id;

    // Fetch previous performance from the latest report
    const kpisResult = await pool.request()
      .input('report_id', sql.Int, reportId)
      .query(`
        SELECT [kpi_name], [kpi_target], [kpi_actual] 
        FROM [dbo].[p1_report_kpi_performance] 
        WHERE [report_id] = @report_id
      `);

    const prevKpis = kpisResult.recordset;

    // Helper to calculate status color
    const calculateStatus = (targetStr: string, actualStr: string): string => {
      const parseNum = (val: string): number | null => {
        if (!val) return null;
        const cleaned = val.replace(/[^\d.]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const target = parseNum(targetStr);
      const actual = parseNum(actualStr);

      if (target === null || actual === null) return 'ไม่มีข้อมูล';
      if (actual > target) return 'เขียว';
      if (actual === target) return 'เหลือง';
      return 'แดง';
    };

    const initializedKpis = kpiNames.map(name => {
      // Find matching KPI name in the previous report
      const match = prevKpis.find(pk => pk.kpi_name.trim().toLowerCase() === name.trim().toLowerCase());
      let lastMonthStatus = 'ไม่มีข้อมูล';
      
      if (match) {
        lastMonthStatus = calculateStatus(match.kpi_target, match.kpi_actual);
      }

      return {
        kpi_name: name,
        last_month_status: lastMonthStatus
      };
    });

    return res.status(200).json({
      success: true,
      kpis: initializedKpis
    });

  } catch (err: any) {
    console.error('Error fetching previous KPI statuses:', err);
    // Return templates with 'ไม่มีข้อมูล' as a robust fallback
    const initializedKpis = kpiNames.map(name => ({
      kpi_name: name,
      last_month_status: 'ไม่มีข้อมูล'
    }));
    return res.status(200).json({ success: true, kpis: initializedKpis, dbError: err.message });
  }
};
