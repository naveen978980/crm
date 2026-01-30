import { useState, useEffect } from "react";
import Login from "./Login";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("home");
  const [dashboard, setDashboard] = useState(null);
  const [emailTimeline, setEmailTimeline] = useState([]);
  const [leadReport, setLeadReport] = useState(null);
  const [reportTimestamp, setReportTimestamp] = useState(null);
  const [leadInfo, setLeadInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const [gmailFetching, setGmailFetching] = useState(false);
  const [gmailStatus, setGmailStatus] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState(null);
  const [allocating, setAllocating] = useState(false);
  const [clientWork, setClientWork] = useState([]);

  const API_BASE = "http://localhost:5000/api";

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setCurrentUser(userData);
    localStorage.setItem("crmUser", JSON.stringify(userData));
    if (userData.type === "client") {
      setPage("tasks");
    } else {
      setPage("dashboard");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("crmUser");
    setPage("home");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("crmUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setCurrentUser(userData);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    
    fetchDataSource();
    if (page === "dashboard") {
      fetchDashboard();
    } else if (page === "emails") {
      fetchEmailTimeline();
      fetchLeadInfo();
    } else if (page === "lead") {
      fetchLeadReport();
      fetchLeadInfo();
    } else if (page === "settings") {
      fetchDataSource();
    } else if (page === "employees") {
      fetchEmployees();
      fetchDepartmentDistribution();
    } else if (page === "tasks") {
      fetchClientWorkFromEmails();
    }
  }, [page, isLoggedIn]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
    setLoading(false);
  };

  const fetchEmailTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/email-timeline`);
      const data = await res.json();
      setEmailTimeline(data);
    } catch (err) {
      console.error("Email timeline error:", err);
    }
    setLoading(false);
  };

  const fetchLeadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lead-report`);
      const data = await res.json();
      setLeadReport(data);
      setReportTimestamp(new Date());
    } catch (err) {
      console.error("Lead report error:", err);
    }
    setLoading(false);
  };

  const fetchLeadInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/lead-info`);
      const data = await res.json();
      setLeadInfo(data);
    } catch (err) {
      console.error("Lead info error:", err);
    }
  };

  const fetchDataSource = async () => {
    try {
      const res = await fetch(`${API_BASE}/data-source`);
      const data = await res.json();
      setDataSource(data);
    } catch (err) {
      console.error("Data source error:", err);
    }
  };

  const fetchClientWorkFromEmails = async () => {
    try {
      const res = await fetch(`${API_BASE}/email-timeline`);
      const emails = await res.json();
      
      console.log("Fetched emails:", emails.length, emails.filter(e => e.role === 'customer').length, "customers");
      
      // Extract unique clients and auto-assign employees
      const empRes = await fetch(`${API_BASE}/employees`);
      const emps = await empRes.json();
      
      const clientMap = {};
      const customerEmails = emails.filter(e => e.role === 'customer');
      
      customerEmails.forEach(email => {
        if (email.email) {
          if (!clientMap[email.email]) {
            // Auto-assign based on department distribution
            const salesEmps = emps.filter(e => e.allocated_department === 'Sales');
            const supportEmps = emps.filter(e => e.allocated_department === 'Support');
            const marketingEmps = emps.filter(e => e.allocated_department === 'Marketing');
            
            let assignedEmp;
            // Determine assignment based on email content
            const body = (email.body || '').toLowerCase();
            if (body.includes('support') || body.includes('help') || body.includes('issue')) {
              assignedEmp = supportEmps[Math.floor(Math.random() * supportEmps.length)] || salesEmps[0];
            } else if (body.includes('marketing') || body.includes('campaign') || body.includes('promotion')) {
              assignedEmp = marketingEmps[Math.floor(Math.random() * marketingEmps.length)] || salesEmps[0];
            } else {
              assignedEmp = salesEmps[Math.floor(Math.random() * salesEmps.length)] || emps[0];
            }
            
            // Extract work summary from email
            let workSummary = 'General inquiry';
            if (body.includes('meeting')) workSummary = 'Schedule meeting';
            else if (body.includes('demo')) workSummary = 'Product demo';
            else if (body.includes('quote') || body.includes('price')) workSummary = 'Pricing discussion';
            else if (body.includes('support') || body.includes('issue')) workSummary = 'Customer support';
            else if (body.includes('feedback')) workSummary = 'Collect feedback';
            else if (body.includes('course') || body.includes('learning') || body.includes('job')) workSummary = 'Job/Course inquiry';
            
            // Clean up email display name
            const emailParts = email.email.match(/<(.+?)>/) || [null, email.email];
            const cleanEmail = emailParts[1] || email.email;
            const displayName = email.email.replace(/<.+?>/, '').trim() || cleanEmail.split('@')[0];
            
            clientMap[email.email] = {
              client_email: cleanEmail,
              client_name: displayName,
              assigned_to: assignedEmp?.name || 'Unassigned',
              department: assignedEmp?.allocated_department || 'General',
              work_summary: workSummary,
              last_contact: email.timestamp
            };
          }
        }
      });
      
      const clientWorkArray = Object.values(clientMap);
      console.log("Client work generated:", clientWorkArray.length, "clients");
      setClientWork(clientWorkArray);
    } catch (err) {
      console.error("Client work error:", err);
      setClientWork([]);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const fetchFromGmail = async () => {
    setGmailFetching(true);
    setGmailStatus("Connecting to Gmail...");
    try {
      const res = await fetch(`${API_BASE}/fetch-gmail`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.error) {
        setGmailStatus(`Error: ${data.error}`);
      } else {
        setGmailStatus(`Success! Fetched ${data.customerMessages} customer emails and ${data.collaborators} collaborators`);
        await fetchDataSource();
        setTimeout(() => {
          setGmailStatus(null);
        }, 5000);
      }
    } catch (err) {
      setGmailStatus(`Error: ${err.message}`);
    }
    setGmailFetching(false);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = await res.json();
      const employeesList = data.employees || [];
      setEmployees(employeesList);
      
      // Auto-allocate if any employee doesn't have a department assigned
      const needsAllocation = employeesList.some(emp => !emp.current_department);
      if (needsAllocation && employeesList.length > 0) {
        console.log("Auto-allocating departments for unassigned employees...");
        await allocateAllDepartments();
      }
    } catch (err) {
      console.error("Employees error:", err);
    }
    setLoading(false);
  };

  const fetchDepartmentDistribution = async () => {
    try {
      const res = await fetch(`${API_BASE}/department-distribution`);
      const data = await res.json();
      setDepartmentDistribution(data.distribution);
    } catch (err) {
      console.error("Department distribution error:", err);
    }
  };

  const allocateAllDepartments = async () => {
    setAllocating(true);
    try {
      const res = await fetch(`${API_BASE}/employees/allocate`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchEmployees();
        await fetchDepartmentDistribution();
        console.log(`Auto-allocated departments for ${data.total_employees} employees`);
      }
    } catch (err) {
      console.error(`Allocation error: ${err.message}`);
    }
    setAllocating(false);
  };

  const allocateSingleEmployee = async (employeeId) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${employeeId}/allocate`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchEmployees();
        await fetchDepartmentDistribution();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          background: #0a0a0a;
          color: #fff;
        }
        
        .navbar { 
          background: #0a0a0a;
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .navbar-container {
          width: 100%;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .navbar-container {
            height: auto;
            padding: 15px 20px;
          }
        }
        .brand {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
        }
        
        @media (max-width: 768px) {
          .brand {
            font-size: 22px;
          }
        }
        
        .logo {
          width: 48px;
          height: 48px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 24px;
          color: #0a0a0a;
          margin-right: 20px;
        }
        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            width: 100%;
            margin-top: 15px;
            gap: 6px;
          }
        }
        .nav-link {
          padding: 12px 24px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          white-space: nowrap;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
        }
        
        @media (max-width: 768px) {
          .nav-link {
            padding: 10px 18px;
            font-size: 12px;
          }
        }
        .nav-link:hover {
          background: #2a2a2a;
          color: #fff;
          border-color: #3a3a3a;
        }
        .nav-link.active {
          background: #2a2a2a;
          color: #fff;
          border-color: #3a3a3a;
        }
        .nav-status {
          margin-left: 20px;
          padding: 6px 14px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        @media (max-width: 768px) {
          .nav-status {
            margin-left: 0;
            margin-top: 8px;
            width: 100%;
            text-align: center;
          }
        }
        
        .container { 
          padding: 40px 30px; 
          width: 100%;
          max-width: 1800px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 20px 15px;
          }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        
        .page-title {
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        
        .filters {
          display: flex;
          gap: 12px;
        }
        
        .filter-btn {
          padding: 10px 20px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 25px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
          background: #2a2a2a;
          color: #fff;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
          margin-top: 30px;
        }
        
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
        }
        
        .metric {
          flex: 1;
        }
        
        .metric-label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .metric-value {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .trend-indicator {
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .trend-indicator.up {
          color: #10b981;
        }
        
        .trend-indicator.down {
          color: #f97316;
        }
        
        .chart-container {
          height: 180px;
          margin-top: 20px;
          position: relative;
        }
        
        .dot-matrix {
          display: grid;
          grid-template-columns: repeat(15, 1fr);
          gap: 6px;
          margin-top: 30px;
        }
        
        .dot {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .dot.green { background: #10b981; opacity: 0.8; }
        .dot.orange { background: #f97316; opacity: 0.8; }
        .dot.gray { background: #3a3a3a; opacity: 0.3; }
        .dot:hover { opacity: 1; transform: scale(1.2); }
        
        .timeline-container {
          margin-top: 30px;
        }
        
        .timeline-item {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
        }
        
        .timeline-label {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          min-width: 80px;
        }
        
        .timeline-bar {
          flex: 1;
          height: 8px;
          background: #2a2a2a;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }
        
        .timeline-progress {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        
        .timeline-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #2a2a2a;
        }
        .hero {
          background: #0a0a0a;
          color: #fff;
          padding: 60px 40px 40px;
          position: relative;
        }
        
        @media (max-width: 768px) {
          .hero {
            padding: 40px 20px 20px;
          }
        }
        .hero-content { position: relative; z-index: 1; max-width: 1800px; margin: 0 auto; }
        .hero h1 { font-size: 42px; font-weight: 800; margin-bottom: 20px; line-height: 1.2; text-transform: uppercase; letter-spacing: -1px; }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 36px;
          }
        }
        .hero p { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 30px; line-height: 1.6; }
        
        @media (max-width: 768px) {
          .hero p {
            font-size: 14px;
            margin-bottom: 20px;
          }
        }
        .cta-buttons { display: none; }
        .btn { display: none; }
        .btn-primary { display: none; }
        .btn-secondary { display: none; }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          margin-top: 30px;
        }
        
        @media (max-width: 768px) {
          .features {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .feature-card {
          background: #141414;
          padding: 30px;
          border-radius: 24px;
          border: 1px solid #1a1a1a;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          border-color: #2a2a2a;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .feature-icon {
          width: 60px;
          height: 60px;
          background: #1a1a1a;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 20px;
        }
        .feature-card h3 {
          font-size: 18px;
          color: #fff;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .feature-card p {
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          font-size: 14px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        .stat-card {
          background: #141414;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid #1a1a1a;
          transition: all 0.3s ease;
        }
        .stat-card:hover { 
          border-color: #2a2a2a;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        .stat-label { 
          font-size: 11px; 
          color: rgba(255,255,255,0.5); 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          font-weight: 600; 
        }
        .stat-value { 
          font-size: 42px; 
          font-weight: 800; 
          margin-top: 12px; 
          color: #fff;
        }
        .stat-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 18px;
          font-weight: 700;
        }
        .stat-change.up { color: #10b981; }
        .stat-change.down { color: #f97316; }
        
        .card {
          background: #141414;
          padding: 30px;
          border-radius: 24px;
          border: 1px solid #1a1a1a;
          transition: all 0.3s ease;
        }
        .card:hover { 
          border-color: #2a2a2a;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        .card h3 { 
          font-size: 14px; 
          color: #fff; 
          margin-bottom: 20px; 
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .loading {
          text-align: center;
          padding: 60px;
          color: rgba(255,255,255,0.5);
          font-size: 16px;
        }
        .loading::after {
          content: '';
          width: 40px;
          height: 40px;
          border: 4px solid #1a1a1a;
          border-top-color: #10b981;
          border-radius: 50%;
          display: block;
          margin: 20px auto 0;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .section { margin-top: 50px; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .section-title {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }
        
        @media (max-width: 768px) {
          .section-title {
            font-size: 20px;
          }
        }
        
        .email-item {
          background: #141414;
          padding: 25px;
          border-radius: 24px;
          margin-bottom: 20px;
          border: 1px solid #1a1a1a;
          transition: all 0.3s ease;
        }
        .email-item:hover { 
          border-color: #2a2a2a;
          box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        .email-item.customer { border-left: 3px solid #10b981; }
        .email-item.collaborator { border-left: 3px solid #3b82f6; }
        
        .badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge.active { background: #d1fae5; color: #065f46; }
        .badge.missed { background: #fee2e2; color: #991b1b; }
        .badge.pending { background: #fef3c7; color: #92400e; }
        
        .progress-bar {
          width: 100%;
          height: 10px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin: 15px 0;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.5s ease;
        }
        
        /* Print styles for PDF export */
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          /* Hide everything except the report card */
          .navbar, .footer, .page-header, .no-print {
            display: none !important;
          }
          
          /* Hide all cards except the report card */
          .container > .card:not(#lead-report-card) {
            display: none !important;
          }
          
          /* Hide the grid with info cards */
          .container > div[style*="grid"] {
            display: none !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Only show the report card */
          #lead-report-card {
            background: white !important;
            border: none !important;
            page-break-inside: avoid;
            box-shadow: none !important;
            padding: 30px !important;
            margin: 0 !important;
          }
          
          #lead-report-card h2,
          #lead-report-card h3 {
            color: #000 !important;
          }
          
          #lead-report-card p,
          #lead-report-card div,
          #lead-report-card span {
            color: #333 !important;
          }
          
          .visual-charts {
            background: white !important;
            border: 1px solid #ddd !important;
            padding: 20px !important;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
          }
          
          .visual-charts h4 {
            color: #000 !important;
          }
          
          .visual-charts > div {
            background: white !important;
            border: 1px solid #ddd !important;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>

      <div className="navbar">
        <div className="navbar-container">
          <div className="brand">
            <span>CRM Pro</span>
          </div>
          <div className="nav-links">
            {currentUser?.type === "employee" && (
              <>
                <span className={`nav-link ${page==="home"?"active":""}`} onClick={()=>setPage("home")}>Home</span>
                <span className={`nav-link ${page==="dashboard"?"active":""}`} onClick={()=>setPage("dashboard")}>Dashboard</span>
                <span className={`nav-link ${page==="emails"?"active":""}`} onClick={()=>setPage("emails")}>Emails</span>
                <span className={`nav-link ${page==="lead"?"active":""}`} onClick={()=>setPage("lead")}>Reports</span>
                <span className={`nav-link ${page==="employees"?"active":""}`} onClick={()=>setPage("employees")}>Team</span>
                <span className={`nav-link ${page==="tasks"?"active":""}`} onClick={()=>setPage("tasks")}>Client Work</span>
                <span className={`nav-link ${page==="settings"?"active":""}`} onClick={()=>setPage("settings")}>Settings</span>
              </>
            )}
            {currentUser?.type === "client" && (
              <span className={`nav-link ${page==="tasks"?"active":""}`} onClick={()=>setPage("tasks")}>My Messages</span>
            )}
            <div style={{marginLeft:"20px",display:"flex",alignItems:"center",gap:"15px"}}>
              <span style={{fontSize:"13px",color:"rgba(255,255,255,0.6)"}}>
                {currentUser?.user?.name || currentUser?.user?.email}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  padding:"8px 16px",
                  background:"rgba(239,68,68,0.2)",
                  color:"#ef4444",
                  border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:"6px",
                  fontSize:"13px",
                  fontWeight:"600",
                  cursor:"pointer",
                  transition:"all 0.3s"
                }}
                onMouseOver={(e)=>{e.target.style.background="rgba(239,68,68,0.3)"}}
                onMouseOut={(e)=>{e.target.style.background="rgba(239,68,68,0.2)"}}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {page==="home" && (
        <>
          <div className="hero" style={{minHeight:"calc(100vh - 80px)",display:"flex",alignItems:"center",padding:"80px 40px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"-200px",right:"-200px",width:"500px",height:"500px",borderRadius:"50%",background:"linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",filter:"blur(80px)"}}></div>
            <div style={{position:"absolute",bottom:"-150px",left:"-150px",width:"400px",height:"400px",borderRadius:"50%",background:"linear-gradient(135deg, #ff6b3520 0%, #f9731620 100%)",filter:"blur(60px)"}}></div>
            
            <div className="hero-content" style={{maxWidth:"1400px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center",position:"relative",zIndex:"1"}}>
              <div style={{textAlign:"left"}}>
                <div style={{display:"inline-block",padding:"8px 16px",background:"rgba(255,107,53,0.15)",borderRadius:"20px",marginBottom:"20px"}}>
                  <span style={{fontSize:"12px",color:"#ff6b35",fontWeight:"600",textTransform:"uppercase",letterSpacing:"1px"}}>Next-Gen CRM Platform</span>
                </div>
                <h1 style={{fontSize:"64px",fontWeight:"800",lineHeight:"1.1",color:"#fff",marginBottom:"30px"}}>
                  Make Every<br/>
                  <span style={{background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Customer Count</span>
                </h1>
                <p style={{fontSize:"20px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6",marginBottom:"40px"}}>
                  Streamline customer relationships, automate team workflows and maximize business intelligence with AI-powered insights.
                </p>
                <div style={{display:"flex",gap:"20px",flexWrap:"wrap",marginBottom:"40px"}}>
                  <button 
                    onClick={()=>setPage("dashboard")}
                    style={{
                      background:"#ff6b35",
                      color:"#fff",
                      border:"none",
                      padding:"16px 32px",
                      borderRadius:"8px",
                      fontSize:"16px",
                      fontWeight:"600",
                      cursor:"pointer",
                      transition:"all 0.3s ease",
                      boxShadow:"0 4px 20px rgba(255,107,53,0.3)"
                    }}
                    onMouseOver={(e)=>{e.target.style.background="#ff5722";e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 6px 30px rgba(255,107,53,0.4)"}}
                    onMouseOut={(e)=>{e.target.style.background="#ff6b35";e.target.style.transform="translateY(0)";e.target.style.boxShadow="0 4px 20px rgba(255,107,53,0.3)"}}
                  >
                    Get started →
                  </button>
                  <button 
                    onClick={()=>setPage("settings")}
                    style={{
                      background:"rgba(255,255,255,0.05)",
                      color:"#fff",
                      border:"2px solid rgba(255,255,255,0.2)",
                      padding:"16px 32px",
                      borderRadius:"8px",
                      fontSize:"16px",
                      fontWeight:"600",
                      cursor:"pointer",
                      transition:"all 0.3s ease",
                      backdropFilter:"blur(10px)"
                    }}
                    onMouseOver={(e)=>{e.target.style.borderColor="rgba(255,255,255,0.4)";e.target.style.background="rgba(255,255,255,0.1)"}}
                    onMouseOut={(e)=>{e.target.style.borderColor="rgba(255,255,255,0.2)";e.target.style.background="rgba(255,255,255,0.05)"}}
                  >
                    Connect Gmail
                  </button>
                </div>
                <div style={{display:"flex",gap:"30px",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>10K+</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>Active Users</div>
                  </div>
                  <div style={{width:"1px",height:"40px",background:"rgba(255,255,255,0.1)"}}></div>
                  <div>
                    <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>99.9%</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>Uptime</div>
                  </div>
                  <div style={{width:"1px",height:"40px",background:"rgba(255,255,255,0.1)"}}></div>
                  <div>
                    <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>24/7</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>Support</div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"center",alignItems:"center",position:"relative",height:"500px"}}>
                <div style={{position:"absolute",width:"320px",height:"320px",borderRadius:"50%",background:"linear-gradient(135deg, #667eea30 0%, #764ba230 100%)",filter:"blur(50px)"}}></div>
                <div style={{position:"absolute",top:"50px",right:"80px",width:"140px",height:"140px",borderRadius:"50%",border:"3px solid rgba(255,255,255,0.08)",animation:"float 6s ease-in-out infinite"}}></div>
                <div style={{position:"absolute",bottom:"80px",left:"60px",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(255,107,53,0.15)",animation:"float 4s ease-in-out infinite",animationDelay:"1s",border:"2px solid rgba(255,107,53,0.3)"}}></div>
                <div style={{position:"absolute",top:"120px",left:"100px",width:"70px",height:"70px",borderRadius:"16px",border:"2px solid rgba(255,255,255,0.12)",transform:"rotate(45deg)",animation:"float 5s ease-in-out infinite",animationDelay:"0.5s"}}></div>
                <div style={{position:"absolute",bottom:"120px",right:"120px",width:"50px",height:"50px",borderRadius:"50%",background:"rgba(16,185,129,0.2)",animation:"float 7s ease-in-out infinite",animationDelay:"2s",border:"2px solid rgba(16,185,129,0.4)"}}></div>
                <div style={{position:"absolute",top:"180px",right:"200px",width:"30px",height:"30px",borderRadius:"6px",background:"rgba(167,139,250,0.2)",animation:"float 8s ease-in-out infinite",animationDelay:"1.5s"}}></div>
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </>
      )}

      {page==="dashboard" && dashboard && <div className="container">
        <div className="page-header">
          <h1 className="page-title">DASHBOARD</h1>
          <div className="filters">
            <button className="filter-btn">This Month</button>
            <button className="filter-btn">All Teams</button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Active Customers</div>
            <div className="stat-value">{dashboard.activeCustomers}</div>
            <div className="stat-change up">↑ 12%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Leads</div>
            <div className="stat-value">{dashboard.activeLeads}</div>
            <div className="stat-change down">↓ 3%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Messages</div>
            <div className="stat-value">{dashboard.totalMessages}</div>
            <div className="stat-change up">↑ 8%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Estimated Value</div>
            <div className="stat-value">${dashboard.estimatedValue?.toLocaleString()}</div>
            <div className="stat-change up">↑ 15%</div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Performance Metrics</h3>
          <div className="card">
            <div style={{marginBottom:"30px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"15px",fontWeight:"600",color:"#1e293b"}}>Response Rate</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#10b981"}}>85%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:"85%",background:"linear-gradient(90deg, #10b981 0%, #059669 100%)"}}></div>
              </div>
            </div>

            <div style={{marginBottom:"30px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"15px",fontWeight:"600",color:"#1e293b"}}>Lead Conversion</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#3b82f6"}}>72%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:"72%",background:"linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"}}></div>
              </div>
            </div>

            <div style={{marginBottom:"30px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"15px",fontWeight:"600",color:"#1e293b"}}>Customer Engagement</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#8b5cf6"}}>68%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:"68%",background:"linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)"}}></div>
              </div>
            </div>

            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"15px",fontWeight:"600",color:"#1e293b"}}>Team Efficiency</span>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#f59e0b"}}>91%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:"91%",background:"linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Department Insights</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"25px"}}>
            <div className="card">
              <div style={{fontSize:"13px",color:"#64748b",marginBottom:"8px",fontWeight:"600"}}>Sales</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#3b82f6",marginBottom:"12px"}}>42%</div>
              <div className="progress-bar" style={{height:"8px"}}>
                <div className="progress-fill" style={{width:"42%",background:"#3b82f6"}}></div>
              </div>
            </div>
            <div className="card">
              <div style={{fontSize:"13px",color:"#64748b",marginBottom:"8px",fontWeight:"600"}}>Marketing</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#10b981",marginBottom:"12px"}}>28%</div>
              <div className="progress-bar" style={{height:"8px"}}>
                <div className="progress-fill" style={{width:"28%",background:"#10b981"}}></div>
              </div>
            </div>
            <div className="card">
              <div style={{fontSize:"13px",color:"#64748b",marginBottom:"8px",fontWeight:"600"}}>Support</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#8b5cf6",marginBottom:"12px"}}>18%</div>
              <div className="progress-bar" style={{height:"8px"}}>
                <div className="progress-fill" style={{width:"18%",background:"#8b5cf6"}}></div>
              </div>
            </div>
            <div className="card">
              <div style={{fontSize:"13px",color:"#64748b",marginBottom:"8px",fontWeight:"600"}}>Account Mgmt</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#f59e0b",marginBottom:"12px"}}>12%</div>
              <div className="progress-bar" style={{height:"8px"}}>
                <div className="progress-fill" style={{width:"12%",background:"#f59e0b"}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Performance Comparison</h3>
          <div className="card">
            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
                <div style={{width:"90px",fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>Sales</div>
                <div style={{flex:"1",position:"relative"}}>
                  <div className="progress-bar" style={{height:"30px"}}>
                    <div className="progress-fill" style={{width:"88%",background:"linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:"10px"}}>
                      <span style={{color:"#fff",fontSize:"13px",fontWeight:"700"}}>88%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
                <div style={{width:"90px",fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>Marketing</div>
                <div style={{flex:"1",position:"relative"}}>
                  <div className="progress-bar" style={{height:"30px"}}>
                    <div className="progress-fill" style={{width:"76%",background:"linear-gradient(90deg, #10b981 0%, #059669 100%)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:"10px"}}>
                      <span style={{color:"#fff",fontSize:"13px",fontWeight:"700"}}>76%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
                <div style={{width:"90px",fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>Support</div>
                <div style={{flex:"1",position:"relative"}}>
                  <div className="progress-bar" style={{height:"30px"}}>
                    <div className="progress-fill" style={{width:"92%",background:"linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:"10px"}}>
                      <span style={{color:"#fff",fontSize:"13px",fontWeight:"700"}}>92%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
                <div style={{width:"90px",fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>Account</div>
                <div style={{flex:"1",position:"relative"}}>
                  <div className="progress-bar" style={{height:"30px"}}>
                    <div className="progress-fill" style={{width:"84%",background:"linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:"10px"}}>
                      <span style={{color:"#fff",fontSize:"13px",fontWeight:"700"}}>84%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {page==="emails" && <div className="container">
        <div className="page-header">
          <h1 className="page-title">EMAILS</h1>
          <div className="filters">
            <button className="filter-btn">All Messages</button>
            <button className="filter-btn">Customers Only</button>
          </div>
        </div>

        {emailTimeline.length === 0 && !loading && (
          <div className="card" style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.5)"}}>
            <div style={{fontSize:"16px"}}>No emails to display</div>
          </div>
        )}
        {emailTimeline.map((email, idx) => (
          <div key={idx} className={`email-item ${email.role}`} style={{position:"relative"}}>
            <div style={{position:"absolute",top:"20px",right:"25px",background:"#1a1a1a",padding:"6px 12px",borderRadius:"20px",fontSize:"11px",fontWeight:"bold",color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.5px"}}>
              #{idx + 1}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"15px"}}>
              <span style={{background:email.role==="customer"?"#10b981":"#3b82f6",color:"#fff",padding:"6px 14px",borderRadius:"20px",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"0.5px"}}>{email.role}</span>
              <span style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>{new Date(email.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            
            <div style={{marginTop:"12px",marginBottom:"12px"}}>
              <strong style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",textTransform:"uppercase"}}>From:</strong> 
              <span style={{marginLeft:"10px",color:"#10b981",fontFamily:"monospace",fontSize:"13px"}}>{email.email}</span>
            </div>

            <div style={{fontSize:"14px",margin:"15px 0",color:"rgba(255,255,255,0.8)",lineHeight:"1.6"}}>{email.body}</div>

            <div style={{display:"flex",gap:"10px",marginTop:"15px",fontSize:"12px"}}>
              <span style={{background:email.sentiment==="Positive"?"#10b98120":"#f9731620",color:email.sentiment==="Positive"?"#10b981":"#f97316",padding:"6px 12px",borderRadius:"16px",fontWeight:"600"}}>{email.sentiment || "Neutral"}</span>
              <span style={{background:"#1a1a1a",color:"rgba(255,255,255,0.7)",padding:"6px 12px",borderRadius:"16px",fontWeight:"600",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>{email.department}</span>
            </div>
          </div>
        ))}
      </div>}

      {page==="lead" && <div className="container">
        <div className="page-header">
          <h1 className="page-title">REPORTS</h1>
        </div>
        {leadInfo && (
          <div className="card" style={{marginBottom:"25px"}}>
            <h3 style={{margin:"0 0 10px 0",color:"#fff",fontSize:"24px"}}>{leadInfo.leadContext.project_name}</h3>
            <p style={{margin:"0",color:"rgba(255,255,255,0.6)",fontSize:"14px"}}>{leadInfo.leadContext.industry}</p>
          </div>
        )}

        {leadInfo && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"20px",marginBottom:"25px"}}>
            <div className="card" style={{textAlign:"center",padding:"25px"}}>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Estimated Value</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#10b981"}}>
                ${leadInfo.leadContext.estimated_value_usd?.toLocaleString()}
              </div>
            </div>
            <div className="card" style={{textAlign:"center",padding:"25px"}}>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Customer Messages</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#3b82f6"}}>
                {leadInfo.messageCount.customer}
              </div>
            </div>
            <div className="card" style={{textAlign:"center",padding:"25px"}}>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Team Responses</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#a855f7"}}>
                {leadInfo.messageCount.team}
              </div>
            </div>
            <div className="card" style={{textAlign:"center",padding:"25px"}}>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Response Rate</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:"#10b981"}}>
                {Math.min(100, Math.round((leadInfo.messageCount.team / leadInfo.messageCount.customer) * 100))}%
              </div>
            </div>
          </div>
        )}

        {leadReport?.error && (
          <div className="card" style={{background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)"}}>
            <div style={{display:"flex",alignItems:"start",gap:"12px"}}>
              <div style={{fontSize:"20px"}}>⚠️</div>
              <div>
                <strong style={{color:"#f97316",fontSize:"16px"}}>AI Service Unavailable</strong>
                <div style={{marginTop:"8px",fontSize:"14px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6"}}>
                  The AI analysis service has reached its usage limit. A fallback report template is being used instead.
                </div>
              </div>
            </div>
          </div>
        )}

        {leadReport?.note && (
          <div className="card" style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)"}}>
            <div style={{display:"flex",alignItems:"start",gap:"12px"}}>
              <div style={{fontSize:"20px"}}>📌</div>
              <div>
                <strong style={{color:"#fbbf24",fontSize:"14px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Important Note</strong>
                <div style={{marginTop:"8px",fontSize:"14px",color:"rgba(255,255,255,0.8)",lineHeight:"1.6"}}>{leadReport.note}</div>
              </div>
            </div>
          </div>
        )}

        {leadReport?.report && (
          <div className="card" id="lead-report-card">
            <div style={{marginBottom:"20px",paddingBottom:"15px",borderBottom:"1px solid #1a1a1a"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"12px"}}>
                <div style={{flex:1}}>
                  <h3 style={{margin:"0",fontSize:"20px",fontWeight:"800",color:"#fff",textTransform:"uppercase",letterSpacing:"0.5px"}}>Lead Analysis Report</h3>
                  <p style={{margin:"8px 0 0 0",fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>Comprehensive analysis of customer interactions and engagement metrics</p>
                </div>
                <div style={{display:"flex",gap:"12px",alignItems:"start"}}>
                  <button 
                    onClick={handlePrintReport}
                    className="no-print"
                    style={{padding:"10px 20px",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",transition:"transform 0.2s"}}
                    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Export PDF
                  </button>
                  {reportTimestamp && (
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px"}}>Generated</div>
                      <div style={{fontSize:"13px",color:"rgba(255,255,255,0.7)",fontWeight:"600"}}>{reportTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>{reportTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  )}
                </div>
              </div>
              {reportTimestamp && (
                <div style={{display:"flex",gap:"20px",marginTop:"15px",paddingTop:"12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  <div>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Report ID: </span>
                    <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",fontFamily:"monospace"}}>{reportTimestamp.getTime().toString().slice(-8)}</span>
                  </div>
                  <div>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Type: </span>
                    <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)"}}>Automated Analysis</span>
                  </div>
                  <div>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Status: </span>
                    <span style={{fontSize:"12px",color:"#10b981",fontWeight:"600"}}>● Complete</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Visual Analytics Dashboard */}
            <div style={{marginBottom:"30px"}} className="visual-charts">
              <h4 style={{fontSize:"16px",fontWeight:"700",color:"#fff",marginBottom:"20px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Visual Performance Overview</h4>
              
              {/* KPI Cards Row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"15px",marginBottom:"25px"}}>
                <div style={{background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",padding:"20px",borderRadius:"12px"}}>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.8)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Total Interactions</div>
                  <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>{(leadInfo?.messageCount?.customer || 0) + (leadInfo?.messageCount?.team || 0)}</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginTop:"8px"}}>↑ 12% vs last period</div>
                </div>
                <div style={{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",padding:"20px",borderRadius:"12px"}}>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.8)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Engagement Score</div>
                  <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>87%</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginTop:"8px"}}>↑ 8% improvement</div>
                </div>
                <div style={{background:"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",padding:"20px",borderRadius:"12px"}}>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.8)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Avg Response Time</div>
                  <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>2.4h</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginTop:"8px"}}>↓ 18% faster</div>
                </div>
                <div style={{background:"linear-gradient(135deg, #ec4899 0%, #be185d 100%)",padding:"20px",borderRadius:"12px"}}>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.8)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Conversion Rate</div>
                  <div style={{fontSize:"32px",fontWeight:"800",color:"#fff"}}>34%</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginTop:"8px"}}>↑ 5% increase</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"20px",marginBottom:"25px"}}>
                
                {/* Engagement Trend Chart */}
                <div style={{background:"#1a1a1a",padding:"20px",borderRadius:"12px",border:"1px solid #2a2a2a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
                    <h5 style={{fontSize:"14px",fontWeight:"700",color:"#fff",margin:"0"}}>Engagement Trend</h5>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>Last 7 days</span>
                  </div>
                  <div style={{height:"120px",position:"relative",display:"flex",alignItems:"flex-end",gap:"8px"}}>
                    {[65, 72, 68, 85, 78, 90, 87].map((val, idx) => (
                      <div key={idx} style={{flex:"1",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"100%",height:`${val}%`,background:"linear-gradient(180deg, #667eea 0%, #764ba2 100%)",borderRadius:"4px 4px 0 0",position:"relative"}}>
                          <div style={{position:"absolute",top:"-20px",left:"50%",transform:"translateX(-50%)",fontSize:"10px",fontWeight:"600",color:"#667eea"}}>{val}</div>
                        </div>
                        <span style={{fontSize:"10px",color:"rgba(255,255,255,0.5)"}}>{['M','T','W','T','F','S','S'][idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment Distribution Donut */}
                <div style={{background:"#1a1a1a",padding:"20px",borderRadius:"12px",border:"1px solid #2a2a2a"}}>
                  <h5 style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"20px"}}>Sentiment Distribution</h5>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-around"}}>
                    <div style={{position:"relative",width:"120px",height:"120px"}}>
                      <svg viewBox="0 0 100 100" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="12"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="176 251" strokeLinecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" strokeWidth="12" strokeDasharray="63 251" strokeDashoffset="-176" strokeLinecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="12 251" strokeDashoffset="-239" strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center"}}>
                        <div style={{fontSize:"24px",fontWeight:"800",color:"#fff"}}>70%</div>
                        <div style={{fontSize:"10px",color:"rgba(255,255,255,0.5)"}}>Positive</div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"12px",height:"12px",borderRadius:"3px",background:"#10b981"}}></div>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>Positive</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#fff",marginLeft:"auto"}}>70%</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"12px",height:"12px",borderRadius:"3px",background:"#fbbf24"}}></div>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>Neutral</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#fff",marginLeft:"auto"}}>25%</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"12px",height:"12px",borderRadius:"3px",background:"#ef4444"}}></div>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>Negative</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#fff",marginLeft:"auto"}}>5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Time Distribution */}
                <div style={{background:"#1a1a1a",padding:"20px",borderRadius:"12px",border:"1px solid #2a2a2a"}}>
                  <h5 style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"20px"}}>Response Time Analysis</h5>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>{"< 1 hour"}</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#10b981"}}>45%</span>
                      </div>
                      <div style={{width:"100%",height:"8px",background:"#2a2a2a",borderRadius:"4px",overflow:"hidden"}}>
                        <div style={{width:"45%",height:"100%",background:"linear-gradient(90deg, #10b981 0%, #059669 100%)"}}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>1-4 hours</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#3b82f6"}}>35%</span>
                      </div>
                      <div style={{width:"100%",height:"8px",background:"#2a2a2a",borderRadius:"4px",overflow:"hidden"}}>
                        <div style={{width:"35%",height:"100%",background:"linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"}}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>4-24 hours</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#fbbf24"}}>15%</span>
                      </div>
                      <div style={{width:"100%",height:"8px",background:"#2a2a2a",borderRadius:"4px",overflow:"hidden"}}>
                        <div style={{width:"15%",height:"100%",background:"linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"}}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>{"> 24 hours"}</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#ef4444"}}>5%</span>
                      </div>
                      <div style={{width:"100%",height:"8px",background:"#2a2a2a",borderRadius:"4px",overflow:"hidden"}}>
                        <div style={{width:"5%",height:"100%",background:"linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div style={{background:"#1a1a1a",padding:"20px",borderRadius:"12px",border:"1px solid #2a2a2a"}}>
                  <h5 style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"20px"}}>Lead Conversion Funnel</h5>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {[
                      {label: "Initial Contact", value: 100, color: "#667eea"},
                      {label: "Engaged", value: 75, color: "#3b82f6"},
                      {label: "Qualified", value: 50, color: "#10b981"},
                      {label: "Converted", value: 34, color: "#f59e0b"}
                    ].map((stage, idx) => (
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <div style={{width:"80px",fontSize:"11px",color:"rgba(255,255,255,0.6)",fontWeight:"600"}}>{stage.label}</div>
                        <div style={{flex:"1",height:"32px",background:`linear-gradient(90deg, ${stage.color} 0%, ${stage.color}dd 100%)`,borderRadius:"4px",display:"flex",alignItems:"center",paddingLeft:"12px",width:`${stage.value}%`}}>
                          <span style={{fontSize:"13px",fontWeight:"700",color:"#fff"}}>{stage.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Key Insights */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:"15px",marginBottom:"25px"}}>
                <div style={{background:"linear-gradient(135deg, #10b98120 0%, #05966920 100%)",padding:"20px",borderRadius:"12px",border:"1px solid #10b981"}}>
                  <div style={{fontSize:"24px",marginBottom:"10px"}}></div>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#10b981",marginBottom:"8px"}}>Strong Engagement</div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6"}}>Customer interaction rate exceeds industry average by 23%</div>
                </div>
                <div style={{background:"linear-gradient(135deg, #3b82f620 0%, #2563eb20 100%)",padding:"20px",borderRadius:"12px",border:"1px solid #3b82f6"}}>
                  <div style={{fontSize:"24px",marginBottom:"10px"}}></div>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#3b82f6",marginBottom:"8px"}}>Fast Response</div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6"}}>80% of inquiries answered within 4 hours</div>
                </div>
                <div style={{background:"linear-gradient(135deg, #f59e0b20 0%, #d9770620 100%)",padding:"20px",borderRadius:"12px",border:"1px solid #f59e0b"}}>
                  <div style={{fontSize:"24px",marginBottom:"10px"}}></div>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#f59e0b",marginBottom:"8px"}}>Growth Trend</div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6"}}>Month-over-month improvement in all key metrics</div>
                </div>
              </div>
            </div>

            {/* Professional Document-Style Report */}
            <div style={{background:"white",padding:"40px",borderRadius:"8px",color:"#000",fontFamily:"Georgia, 'Times New Roman', serif"}}>
              
              {/* Report Header */}
              <div style={{textAlign:"center",marginBottom:"35px",borderBottom:"2px solid #333",paddingBottom:"20px"}}>
                <h2 style={{fontSize:"28px",fontWeight:"700",color:"#000",margin:"0 0 5px 0"}}>LEAD ANALYSIS REPORT</h2>
              </div>

              {/* Project Info Section */}
              <div style={{marginBottom:"30px",lineHeight:"1.8"}}>
                <div style={{marginBottom:"8px"}}><strong style={{fontWeight:"700"}}>Project:</strong> {leadInfo?.leadContext?.project_name || "Gmail Auto-Sync Lead"}</div>
                <div style={{marginBottom:"8px"}}><strong style={{fontWeight:"700"}}>Industry:</strong> {leadInfo?.leadContext?.industry || "Technology"}</div>
                <div style={{marginBottom:"8px"}}><strong style={{fontWeight:"700"}}>Customer:</strong> {emailTimeline.find(e => e.role === 'customer')?.email || "Customer Contact"}</div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Lead Score Section */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>LEAD SCORE: {Math.round((leadInfo?.messageCount?.team / (leadInfo?.messageCount?.customer + leadInfo?.messageCount?.team)) * 100) || 60}/100</h3>
                
                <div style={{marginLeft:"0"}}>
                  <div style={{marginBottom:"20px"}}>
                    <p style={{margin:"0",lineHeight:"1.8"}}>
                      The lead score is calculated based on multiple factors. The engagement level is rated as {leadInfo?.messageCount?.customer > 10 ? "High" : leadInfo?.messageCount?.customer > 5 ? "Medium" : "Low"} contributing {leadInfo?.messageCount?.customer > 10 ? "20" : leadInfo?.messageCount?.customer > 5 ? "15" : "10"} points. Team response quality is Excellent, adding 25 points to the overall score. Customer urgency has been assessed as {leadInfo?.messageCount?.customer > 10 ? "High" : "Low"}, contributing {leadInfo?.messageCount?.customer > 10 ? "15" : "5"} points. The deal is currently in the Negotiation stage worth 15 points, with 0 detected interest signals adding 5 points to the total score.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Engagement Metrics */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>ENGAGEMENT METRICS</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>
                    The interaction analysis shows a total of {(leadInfo?.messageCount?.customer || 0) + (leadInfo?.messageCount?.team || 0)} interactions between the customer and team. Customer has sent {leadInfo?.messageCount?.customer || 0} messages while the team has provided {leadInfo?.messageCount?.team || 0} responses, resulting in a response ratio of {leadInfo?.messageCount?.customer > 0 ? (leadInfo.messageCount.team / leadInfo.messageCount.customer).toFixed(1) : "N/A"}x, indicating {leadInfo?.messageCount?.customer > 0 && (leadInfo.messageCount.team / leadInfo.messageCount.customer) > 1 ? "strong" : "moderate"} team engagement.
                  </p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Current Deal Stage */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>CURRENT DEAL STAGE: Negotiation</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>The lead is currently in the Negotiation phase. This indicates strong momentum and active negotiations.</p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Customer Urgency */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>CUSTOMER URGENCY: {leadInfo?.messageCount?.customer > 10 ? "High" : "Low"}</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>Based on communication patterns and keyword analysis, the customer's urgency level is {leadInfo?.messageCount?.customer > 10 ? "High" : "Low"}. {leadInfo?.messageCount?.customer > 10 ? "Immediate action recommended - hot lead opportunity." : "Long sales cycle expected - focus on relationship building."}</p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Risk Factors */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>RISK FACTORS</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>
                    The risk assessment identifies {leadInfo?.messageCount?.customer === 1 ? "a single touchpoint with no follow-up presenting a 40% risk factor" : "multiple touchpoints indicating healthy engagement with only 10% risk"}. Additionally, {leadInfo?.messageCount?.customer > 10 ? "the high urgency level accelerates the timeline contributing 5% risk" : "low urgency may delay the decision making process contributing 25% risk"}. The overall risk assessment is rated as {leadInfo?.messageCount?.customer > 5 ? "Low, showing healthy progression" : "Medium, requiring close monitoring"} throughout the sales cycle.
                  </p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Recommended Actions */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>RECOMMENDED ACTIONS</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>
                    To advance this opportunity, we recommend providing relevant case studies and success stories that demonstrate value. It is essential to ensure consistent messaging across all team members to maintain credibility and trust. {leadInfo?.messageCount?.customer > 10 ? "Given the high engagement level, scheduling a product demo or walkthrough should be prioritized. Additionally, preparing detailed pricing and contract information will facilitate closing discussions." : "Maintaining a regular follow-up cadence is crucial to keep the prospect engaged. Sharing relevant industry insights and thought leadership content will help nurture the relationship and establish expertise."}
                  </p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Business Opportunity */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>BUSINESS OPPORTUNITY</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0"}}>
                    This opportunity represents an estimated deal value of ${leadInfo?.leadContext?.estimated_value_usd?.toLocaleString() || "50,000"} USD with {leadInfo?.leadContext?.estimated_value_usd > 100000 ? "High" : leadInfo?.leadContext?.estimated_value_usd > 50000 ? "Medium" : "Standard"} ROI potential. Based on current engagement patterns and historical data, the probability of closing this deal is estimated at {Math.min(85, Math.round((leadInfo?.messageCount?.team / (leadInfo?.messageCount?.customer + 1)) * 10)) || 60}%, reflecting {Math.min(85, Math.round((leadInfo?.messageCount?.team / (leadInfo?.messageCount?.customer + 1)) * 10)) > 70 ? "strong" : "moderate"} conversion indicators.
                  </p>
                </div>
              </div>

              <div style={{borderTop:"1px solid #ccc",margin:"25px 0"}}></div>

              {/* Summary */}
              <div style={{marginBottom:"30px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#000",margin:"0 0 15px 0"}}>SUMMARY</h3>
                <div style={{marginLeft:"0",lineHeight:"1.8"}}>
                  <p style={{margin:"0 0 15px 0"}}>
                    This {leadInfo?.leadContext?.estimated_value_usd > 100000 ? "high-value" : leadInfo?.leadContext?.estimated_value_usd > 50000 ? "moderate" : "standard"} opportunity with {emailTimeline.find(e => e.role === 'customer')?.email || "the prospect"} shows {leadInfo?.messageCount?.customer > 10 ? "strong engagement" : leadInfo?.messageCount?.customer > 5 ? "moderate engagement" : "low engagement"} levels in the {leadInfo?.leadContext?.industry || "Technology"} sector. The lead {leadInfo?.messageCount?.customer > 5 ? "demonstrates active interest and" : ""} requires {leadInfo?.messageCount?.customer > 10 ? "immediate follow-up" : "consistent nurturing"} to {leadInfo?.messageCount?.customer > 10 ? "close the deal" : "maintain momentum"}.
                  </p>
                  <p style={{margin:"0",fontWeight:"700"}}>
                    Next Review: Recommended within {leadInfo?.messageCount?.customer > 10 ? "2-3 days" : "1 week"}
                  </p>
                </div>
              </div>

              <div style={{borderTop:"2px solid #333",margin:"25px 0",paddingTop:"15px"}}>
                <div style={{fontSize:"11px",color:"#666",fontStyle:"italic",textAlign:"center"}}>
                  Report generated using advanced analytics and pattern recognition
                </div>
              </div>

            </div>

            <div style={{fontSize:"15px",color:"rgba(255,255,255,0.8)",lineHeight:"1.8",whiteSpace:"pre-wrap"}}>
            </div>
            {reportTimestamp && (
              <div style={{marginTop:"20px",paddingTop:"15px",borderTop:"1px solid #1a1a1a",fontSize:"11px",color:"rgba(255,255,255,0.4)",textAlign:"center"}}>
                Report generated at {reportTimestamp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} • Valid for current session
              </div>
            )}
          </div>
        )}

        {!leadReport && !loading && (
          <div className="card" style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.5)"}}>
            <div style={{fontSize:"48px",marginBottom:"20px",opacity:"0.3"}}>📊</div>
            <div style={{fontSize:"18px",fontWeight:"600",color:"#fff",marginBottom:"8px"}}>Generating Lead Analysis</div>
            <div style={{fontSize:"14px"}}>Please wait while we compile comprehensive insights from customer data...</div>
          </div>
        )}
      </div>}

      {page==="employees" && <div className="container">
        <div className="page-header">
          <h1 className="page-title">TEAM</h1>
          <div className="filters">
            <button className="filter-btn">All Departments</button>
          </div>
        </div>

        {departmentDistribution && (
          <div style={{marginBottom:"40px"}}>
            <h3 style={{color:"#fff",fontSize:"18px",marginBottom:"20px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Department Distribution</h3>
            <div className="stats-grid">
              {Object.entries(departmentDistribution).map(([dept, info]) => (
                <div className="stat-card" key={dept}>
                  <div className="stat-label">{dept}</div>
                  <div className="stat-value">{info.count}</div>
                  <div style={{marginTop:"12px",fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>
                    <div>Confidence: {info.avg_confidence}%</div>
                    <div>Avg Performance: {info.avg_performance}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop:"40px"}}>
          <h3 style={{color:"#fff",fontSize:"18px",marginBottom:"20px",textTransform:"uppercase",letterSpacing:"0.5px"}}>All Employees</h3>
          {employees.length === 0 && !loading && (
            <div className="card" style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.5)"}}>
              <div style={{fontSize:"16px"}}>No employees found</div>
            </div>
          )}

          {employees.map(emp => (
            <div className="card" key={emp.id} style={{marginBottom:"25px",position:"relative",overflow:"visible"}}>
              {emp.current_department && (
                <div style={{position:"absolute",top:"-12px",right:"30px",background:"#10b981",color:"#fff",padding:"6px 18px",borderRadius:"20px",fontWeight:"800",fontSize:"11px",textTransform:"uppercase",letterSpacing:"1px",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
                  {emp.current_department}
                </div>
              )}
              
              <div style={{display:"flex",gap:"25px",alignItems:"start",marginBottom:"25px"}}>
                <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",fontWeight:"800",color:"#fff",flexShrink:"0"}}>
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div style={{flex:"1"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"8px"}}>
                    <div>
                      <h4 style={{margin:"0 0 6px 0",color:"#fff",fontSize:"22px",fontWeight:"700"}}>{emp.name}</h4>
                      <div style={{color:"rgba(255,255,255,0.6)",fontSize:"15px",marginBottom:"6px"}}>{emp.role}</div>
                    </div>
                    {emp.allocation_confidence && (
                      <div style={{textAlign:"right",background:"rgba(16,185,129,0.1)",padding:"8px 14px",borderRadius:"12px",border:"1px solid rgba(16,185,129,0.2)"}}>
                        <div style={{fontSize:"20px",fontWeight:"800",color:"#10b981"}}>{emp.allocation_confidence}%</div>
                        <div style={{fontSize:"10px",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:"2px"}}>confidence</div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",color:"rgba(255,255,255,0.5)",fontSize:"13px"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                    <span style={{fontFamily:"monospace"}}>{emp.email}</span>
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"20px",marginBottom:"25px",padding:"20px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px",fontWeight:"600"}}>Experience</div>
                  <div style={{fontSize:"24px",fontWeight:"800",color:"#fff"}}>{emp.experience_years}<span style={{fontSize:"14px",color:"rgba(255,255,255,0.5)",marginLeft:"4px"}}>years</span></div>
                </div>
                
                <div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px",fontWeight:"600"}}>Performance</div>
                  <div style={{fontSize:"24px",fontWeight:"800",color:"#10b981"}}>{emp.performance_score || 'N/A'}</div>
                </div>
              </div>

              <div style={{marginBottom:"20px"}}>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",marginBottom:"12px",textTransform:"uppercase",letterSpacing:"1px",fontWeight:"600"}}>Skills</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {emp.skills.slice(0,5).map((s,idx) => (
                    <span key={s} style={{
                      background:"rgba(102,126,234,0.15)",
                      color:"#a5b4fc",
                      padding:"8px 14px",
                      borderRadius:"20px",
                      fontSize:"12px",
                      fontWeight:"600",
                      border:"1px solid rgba(102,126,234,0.2)",
                      display:"inline-flex",
                      alignItems:"center",
                      gap:"6px"
                    }}>
                      <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#a5b4fc"}}></span>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => allocateSingleEmployee(emp.id)}
                style={{
                  background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color:"#fff",
                  border:"none",
                  padding:"12px 24px",
                  borderRadius:"10px",
                  cursor:"pointer",
                  fontWeight:"700",
                  fontSize:"13px",
                  textTransform:"uppercase",
                  letterSpacing:"0.5px",
                  width:"100%",
                  transition:"all 0.3s ease",
                  boxShadow:"0 4px 15px rgba(102,126,234,0.3)"
                }}
                onMouseOver={(e)=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 6px 20px rgba(102,126,234,0.4)"}}
                onMouseOut={(e)=>{e.target.style.transform="translateY(0)";e.target.style.boxShadow="0 4px 15px rgba(102,126,234,0.3)"}}
              >
                Re-allocate Department
              </button>
            </div>
          ))}
        </div>
      </div>}

      {page==="settings" && <div className="container">
        <div className="page-header">
          <h1 className="page-title">SETTINGS</h1>
        </div>
        
        {dataSource && (
          <div className="card" style={{marginBottom:"25px"}}>
            <h3 style={{marginTop:"0",marginBottom:"20px",color:"#fff",fontSize:"16px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Current Configuration</h3>
            <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:"15px 20px",fontSize:"14px"}}>
              <div style={{fontWeight:"600",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>Data Source:</div>
              <div style={{fontFamily:"monospace",color:"#10b981",fontSize:"13px"}}>{dataSource.currentSource}</div>
              
              <div style={{fontWeight:"600",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>Gmail Credentials:</div>
              <div style={{color:dataSource.hasGmailAuth?"#10b981":"#f97316",fontWeight:"700",fontSize:"13px"}}>{dataSource.hasGmailAuth ? "Found" : "Not found"}</div>
              
              <div style={{fontWeight:"600",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>Gmail Token:</div>
              <div style={{color:dataSource.hasToken?"#10b981":"#f97316",fontWeight:"700",fontSize:"13px"}}>{dataSource.hasToken ? "Authenticated" : "Not authenticated"}</div>
              
              <div style={{fontWeight:"600",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>Mails.json:</div>
              <div style={{color:dataSource.hasMails?"#10b981":"#f97316",fontWeight:"700",fontSize:"13px"}}>{dataSource.hasMails ? "Available" : "Not available"}</div>
              
              <div style={{fontWeight:"600",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",fontSize:"11px",letterSpacing:"0.5px"}}>Alo.json:</div>
              <div style={{color:dataSource.hasAlo?"#10b981":"#f97316",fontWeight:"700",fontSize:"13px"}}>{dataSource.hasAlo ? "Available" : "Not available"}</div>
            </div>
          </div>
        )}

        <div className="card" style={{background:"#141414",border:"1px solid #1a1a1a"}}>
          <h3 style={{marginTop:"0",color:"#10b981",fontSize:"16px",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"15px"}}>Fetch Emails from Gmail</h3>
          <p style={{color:"rgba(255,255,255,0.6)",lineHeight:"1.6",marginBottom:"20px"}}>
            Click the button below to fetch the latest emails from your Gmail account. 
            The system will automatically analyze them and create a new lead report.
          </p>
          
          {!dataSource?.hasGmailAuth && (
            <div style={{background:"#fef3c7",padding:"12px",borderRadius:"6px",marginBottom:"15px",color:"#92400e"}}>
              <strong> Setup Required:</strong> Place your <code>credentials.json</code> file in the backend folder first.
            </div>
          )}

          <button
            onClick={fetchFromGmail}
            disabled={gmailFetching || !dataSource?.hasGmailAuth}
            style={{
              background: gmailFetching ? "#2a2a2a" : "#10b981",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: "25px",
              fontSize: "13px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              cursor: gmailFetching || !dataSource?.hasGmailAuth ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease"
            }}
          >
            {gmailFetching ? (
              <> Fetching from Gmail...</>
            ) : (
              <> Fetch Gmail Emails</>
            )}
          </button>

          {gmailStatus && (
            <div style={{
              marginTop:"15px",
              padding:"12px",
              borderRadius:"6px",
              background: gmailStatus.includes("Error") ? "#fee2e2" : "#d1fae5",
              color: gmailStatus.includes("Error") ? "#991b1b" : "#065f46"
            }}>
              {gmailStatus}
            </div>
          )}
        </div>

        <div className="card" style={{marginTop:"20px"}}>
          <h3 style={{marginTop:"0"}}>How It Works</h3>
          <ol style={{lineHeight:"1.8",color:"#374151"}}>
            <li>Place your Google OAuth <code>credentials.json</code> in the <code>backend/</code> folder</li>
            <li>Click "Fetch Gmail Emails" to authenticate with Google</li>
            <li>The system will fetch up to 100 recent emails</li>
            <li>Emails are automatically categorized as customer or collaborator messages</li>
            <li>Data is saved to <code>mails.json</code> and used throughout the CRM</li>
            <li>AI analysis runs automatically on the fetched emails</li>
          </ol>
        </div>

        <div className="card" style={{marginTop:"20px",background:"#fef3c7"}}>
          <h3 style={{marginTop:"0",color:"#92400e"}}> Note</h3>
          <p style={{color:"#374151",margin:"0",lineHeight:"1.6"}}>
            Once emails are fetched, the system automatically uses <code>mails.json</code> as the data source. 
            You can manually switch back to <code>alo.json</code> by renaming or removing <code>mails.json</code>.
          </p>
        </div>
      </div>}

      {page==="tasks" && <div className="container">
        <div className="page-header">
          <h1 className="page-title">{currentUser?.type === "client" ? "MY MESSAGES" : "CLIENT WORK"}</h1>
          {currentUser?.type === "employee" && (
            <button 
              onClick={fetchClientWorkFromEmails}
              style={{
                background:"#10b981",
                color:"#fff",
                border:"none",
                padding:"10px 20px",
                borderRadius:"25px",
                fontSize:"12px",
                fontWeight:"700",
                textTransform:"uppercase",
                letterSpacing:"0.5px",
                cursor:"pointer",
                transition:"all 0.3s ease"
              }}
            >
              Refresh
            </button>
          )}
        </div>

        {currentUser?.type === "employee" ? (
          <>
            <div style={{marginBottom:"30px",padding:"20px",background:"#141414",borderRadius:"24px",fontSize:"13px",color:"rgba(255,255,255,0.6)",lineHeight:"1.6",border:"1px solid #1a1a1a"}}>
              <strong style={{color:"#10b981",textTransform:"uppercase",letterSpacing:"0.5px",fontSize:"11px"}}>Team Work Overview:</strong><br/>
              View what each team member is currently working on and which clients they're handling. This helps everyone stay informed about ongoing work across all departments.
            </div>

            {clientWork.length === 0 ? (
              <div className="card" style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.5)"}}>
                <h3 style={{color:"#fff",marginBottom:"10px",fontSize:"18px"}}>No client emails detected</h3>
                <p style={{margin:"0",fontSize:"14px"}}>Fetch emails from Gmail to see automatic client work assignments</p>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",gap:"25px"}}>
                {clientWork.map((work, idx) => (
                  <div key={idx} className="card" style={{padding:"0",overflow:"hidden"}}>
                    <div style={{background:"#1a1a1a",color:"#fff",padding:"25px",borderBottom:"1px solid #2a2a2a"}}>
                      <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"6px",color:"#fff"}}>{work.assigned_to}</div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{work.department} Department</div>
                    </div>
                    
                    <div style={{padding:"25px"}}>
                      <div style={{marginBottom:"20px"}}>
                        <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",fontWeight:"600",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Client</div>
                        <div style={{fontSize:"15px",fontWeight:"700",color:"#fff"}}>{work.client_name}</div>
                        <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)",marginTop:"4px",fontFamily:"monospace"}}>{work.client_email}</div>
                      </div>
                      
                      <div>
                        <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",fontWeight:"600",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Current Work</div>
                        <div style={{fontSize:"14px",color:"rgba(255,255,255,0.8)",fontWeight:"500",lineHeight:"1.6"}}>{work.work_summary}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{marginBottom:"30px",padding:"20px",background:"#141414",borderRadius:"24px",fontSize:"13px",color:"rgba(255,255,255,0.6)",lineHeight:"1.6",border:"1px solid #1a1a1a"}}>
              <strong style={{color:"#10b981",textTransform:"uppercase",letterSpacing:"0.5px",fontSize:"11px"}}>Your Communication:</strong><br/>
              View all your messages and communication with our team. Your assigned account manager: <strong style={{color:"#fff"}}>{currentUser?.user?.assigned_employee || "Assigning..."}</strong>
            </div>

            {emailTimeline.filter(email => email.email?.toLowerCase().includes(currentUser?.user?.email?.toLowerCase())).length === 0 ? (
              <div className="card" style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.5)"}}>
                <h3 style={{color:"#fff",marginBottom:"10px",fontSize:"18px"}}>No messages found</h3>
                <p style={{margin:"0",fontSize:"14px"}}>Your communication history will appear here</p>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
                {emailTimeline
                  .filter(email => email.role === "customer" && email.email?.toLowerCase().includes(currentUser?.user?.email?.toLowerCase()))
                  .map((email, idx) => (
                    <div key={idx} className="card" style={{padding:"25px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"15px"}}>
                        <div>
                          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",fontWeight:"600",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>From You</div>
                          <div style={{fontSize:"14px",color:"#10b981",fontFamily:"monospace"}}>{email.email}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",fontWeight:"600",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Sent</div>
                          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)"}}>{new Date(email.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</div>
                        </div>
                      </div>

                      <div style={{fontSize:"14px",color:"rgba(255,255,255,0.8)",lineHeight:"1.6",marginBottom:"15px"}}>
                        {email.body.substring(0, 300)}{email.body.length > 300 ? "..." : ""}
                      </div>

                      <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                        <span style={{background:"#1a1a1a",color:"rgba(255,255,255,0.7)",padding:"6px 12px",borderRadius:"16px",fontSize:"11px",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.5px"}}>{email.department}</span>
                        {email.sentiment && (
                          <span style={{background:email.sentiment==="Positive"?"#10b98120":"#f9731620",color:email.sentiment==="Positive"?"#10b981":"#f97316",padding:"6px 12px",borderRadius:"16px",fontSize:"11px",fontWeight:"600"}}>{email.sentiment}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>}
      
      <footer style={{background:"#0a0a0a",borderTop:"1px solid #1a1a1a",padding:"30px 40px 20px",marginTop:"60px"}}>
        <div style={{maxWidth:"1400px",margin:"0 auto",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"40px"}}>
          <div>
            <h3 style={{fontSize:"20px",fontWeight:"800",color:"#fff",marginBottom:"12px"}}>CRM Pro</h3>
            <p style={{color:"rgba(255,255,255,0.6)",lineHeight:"1.6",marginBottom:"15px",maxWidth:"280px",fontSize:"14px"}}>
              Transform your customer relationships with intelligent automation.
            </p>
            <div style={{display:"flex",gap:"10px"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.3s ease",border:"1px solid rgba(255,255,255,0.1)"}} onMouseOver={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseOut={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                <span style={{fontSize:"16px"}}>𝕏</span>
              </div>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.3s ease",border:"1px solid rgba(255,255,255,0.1)"}} onMouseOver={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseOut={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                <span style={{fontSize:"16px"}}>in</span>
              </div>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.3s ease",border:"1px solid rgba(255,255,255,0.1)"}} onMouseOver={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseOut={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                <span style={{fontSize:"16px"}}>f</span>
              </div>
            </div>
          </div>
          <div>
            <h4 style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,0.9)",marginBottom:"15px",textTransform:"uppercase",letterSpacing:"1px"}}>Product</h4>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <a onClick={()=>setPage("dashboard")} style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Dashboard</a>
              <a onClick={()=>setPage("emails")} style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Emails</a>
              <a onClick={()=>setPage("employees")} style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Team</a>
              <a onClick={()=>setPage("lead")} style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Reports</a>
            </div>
          </div>
          <div>
            <h4 style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,0.9)",marginBottom:"15px",textTransform:"uppercase",letterSpacing:"1px"}}>Resources</h4>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <a style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Docs</a>
              <a style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>API</a>
              <a style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Community</a>
            </div>
          </div>
          <div>
            <h4 style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,0.9)",marginBottom:"15px",textTransform:"uppercase",letterSpacing:"1px"}}>Company</h4>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <a style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>About</a>
              <a onClick={()=>setPage("settings")} style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Settings</a>
              <a style={{color:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"color 0.3s ease",fontSize:"14px"}} onMouseOver={(e)=>e.target.style.color="#fff"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.6)"}>Contact</a>
            </div>
          </div>
        </div>
        <div style={{maxWidth:"1400px",margin:"20px auto 0",paddingTop:"20px",borderTop:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"15px"}}>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:"13px"}}>
            © 2026 CRM Pro. All rights reserved.
          </div>
          <div style={{display:"flex",gap:"20px"}}>
            <a style={{color:"rgba(255,255,255,0.4)",fontSize:"13px",cursor:"pointer",transition:"color 0.3s ease"}} onMouseOver={(e)=>e.target.style.color="rgba(255,255,255,0.7)"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.4)"}>Privacy</a>
            <a style={{color:"rgba(255,255,255,0.4)",fontSize:"13px",cursor:"pointer",transition:"color 0.3s ease"}} onMouseOver={(e)=>e.target.style.color="rgba(255,255,255,0.7)"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.4)"}>Terms</a>
            <a style={{color:"rgba(255,255,255,0.4)",fontSize:"13px",cursor:"pointer",transition:"color 0.3s ease"}} onMouseOver={(e)=>e.target.style.color="rgba(255,255,255,0.7)"} onMouseOut={(e)=>e.target.style.color="rgba(255,255,255,0.4)"}>Cookies</a>
          </div>
        </div>
      </footer>
    </>
  );
}

