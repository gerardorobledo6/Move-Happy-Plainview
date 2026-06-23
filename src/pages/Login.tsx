import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { normalizeEmail } from '../utils/authUtils';
import logoImg from '../assets/logo-mh.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeCustomers: 0,
    activeUsers: 0,
    activeTasks: 0
  });

  // A small array of fake AI loading statuses for the left side
  const [activeLog, setActiveLog] = useState(0);
  const aiLogs = [
    "Initializing neural operations core...",
    "Syncing with Move Happy global database...",
    "Optimizing predictive delivery routes...",
    "Calibrating real-time tracking streams...",
    "Establishing secure command connection..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLog(prev => (prev + 1) % aiLogs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.get('/auth/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch login stats", err);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await client.post('/auth/login', {
        email: normalizeEmail(email),
        password,
      });

      login(res.data.token, res.data.user);
      navigate('/');

    } catch (err) {
      setError('Invalid credentials. Please verify your clearance.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* LEFT SIDE: AI Operations Preview */}
      <div className={styles.aiPreview}>
        <div className={styles.aiOverlay}></div>
        <div className={styles.aiContent}>
          <div className={styles.aiHeader}>
            <img src={logoImg} alt="Move Happy Logo" className={styles.aiLogoImage} />
            <h2>Move Happy OS</h2>
            <div>ANTIGRAVITY_TEST_2026</div>
            <div className={styles.aiStatusBadge}>
              <span className={styles.aiStatusDot}></span>
              System Online
            </div>
          </div>
          
          <div className={styles.aiVisuals}>
             <div className={styles.glowOrb}></div>
             <div className={styles.glowOrb2}></div>
             <div className={styles.gridOverlay}></div>
             <div className={styles.metricsContainer}>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{stats.activeCustomers}</div>
                  <div className={styles.metricLabel}>Active Customers</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{stats.activeUsers}</div>
                  <div className={styles.metricLabel}>Active Users</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{stats.activeTasks}</div>
                  <div className={styles.metricLabel}>Active Tasks</div>
                </div>
             </div>
          </div>

          <div className={styles.aiLogs}>
             {aiLogs.map((log, index) => (
                <div key={index} className={`${styles.logEntry} ${index === activeLog ? styles.logActive : ''} ${index < activeLog ? styles.logPast : ''} ${index > activeLog ? styles.logFuture : ''}`}>
                   <span className={styles.logTime}>[SYS-{index + 1}00]</span> {log}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Panel */}
      <div className={styles.loginPanel}>
        <div className={styles.loginWrapper}>
          <div className={styles.brandMobile}>
            <img src={logoImg} alt="Move Happy Logo" className={styles.aiLogoImage} />
            Move Happy OS
          </div>
          
          <div className={styles.loginHeader}>
            <h1 className={styles.title}>Command Center</h1>
            <p className={styles.subtitle}>Enter your credentials to access the operations network.</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 10.5C7.44772 10.5 7 10.0523 7 9.5V5.5C7 4.94772 7.44772 4.5 8 4.5C8.55228 4.5 9 4.94772 9 5.5V9.5C9 10.0523 8.55228 10.5 8 10.5ZM8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Operator ID / Email</label>
              <div className={styles.inputWrapper}>
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@movehappy.com"
                  required 
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password">Security Clearance</label>
                <a href="#" className={styles.forgotLink}>Forgot code?</a>
              </div>
              <div className={styles.inputWrapper}>
                <input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? (
                <span className={styles.spinner}></span>
              ) : (
                <>
                  Authenticate
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 3.5L13 8M13 8L8.5 12.5M13 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className={styles.footerInfo}>
            <p className={styles.hint}>Secure environment. Unauthorized access is logged.</p>
            <p className={styles.devHint}>Try: admin@movehappy.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
