import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { userAPI } from '../../utils/apiServices';

const Dashboard = () => {
  const { user, isEntrepreneur, isStudent, isInvestor, loading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load dashboard data after authentication is complete
    if (!authLoading && isAuthenticated && user) {
      console.log('🏠 Dashboard: Auth complete, loading dashboard data...');
      loadDashboardData();
    } else {
      console.log('🏠 Dashboard: Waiting for auth...', { authLoading, isAuthenticated, hasUser: !!user });
    }
  }, [authLoading, isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      // Load user profile data which includes stats
      const response = await userAPI.getProfileData();
      
      setStats(response.data.stats);
      setRecentActivity(response.data.applications?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">
          {authLoading ? 'Authenticating...' : 'Loading dashboard...'}
        </div>
      </div>
    );
  }

  const renderEntrepreneurDashboard = () => (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h1>Welcome, {user?.username}!</h1>
        <p>Manage your startups and find team members</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>My Startups</h3>
          <div className={styles.statNumber}>{stats?.startups_created || 0}</div>
          <Link to="/createstartup" className={styles.statAction}>
            Create New Startup
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Applications Received</h3>
          <div className={styles.statNumber}>{stats?.applications_received || 0}</div>
          <Link to="/account" className={styles.statAction}>
            View Applications
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Profile Views</h3>
          <div className={styles.statNumber}>0</div>
          <Link to="/account" className={styles.statAction}>
            Update Profile
          </Link>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/createstartup" className={styles.actionCard}>
            <h3>Create Startup Listing</h3>
            <p>List your startup for funding or collaboration</p>
          </Link>
          
          <Link to="/pitch-idea" className={styles.actionCard}>
            <h3>Pitch Business Idea</h3>
            <p>Present your startup concept to investors</p>
          </Link>
          
          <Link to="/search" className={styles.actionCard}>
            <h3>Search Startups</h3>
            <p>Find startups to collaborate with or invest in</p>
          </Link>
          
          <Link to="/message" className={styles.actionCard}>
            <h3>Messages</h3>
            <p>Connect with potential team members</p>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h1>Welcome, {user?.username}!</h1>
        <p>Find opportunities and join exciting startups</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Applications Sent</h3>
          <div className={styles.statNumber}>{stats?.applications_submitted || 0}</div>
          <Link to="/account" className={styles.statAction}>
            View Applications
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Favorites</h3>
          <div className={styles.statNumber}>{stats?.favorites_count || 0}</div>
          <Link to="/account" className={styles.statAction}>
            View Favorites
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Profile Views</h3>
          <div className={styles.statNumber}>0</div>
          <Link to="/account" className={styles.statAction}>
            Update Profile
          </Link>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/search" className={styles.actionCard}>
            <h3>Search Opportunities</h3>
            <p>Find startups and positions that match your skills</p>
          </Link>
          
          <Link to="/collaboration" className={styles.actionCard}>
            <h3>Browse Collaborations</h3>
            <p>Discover startups looking for team members</p>
          </Link>
          
          <Link to="/message" className={styles.actionCard}>
            <h3>Messages</h3>
            <p>Connect with startup founders</p>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderInvestorDashboard = () => (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h1>Welcome, {user?.username}!</h1>
        <p>Discover and invest in promising startups</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Favorites</h3>
          <div className={styles.statNumber}>{stats?.favorites_count || 0}</div>
          <Link to="/account" className={styles.statAction}>
            View Favorites
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Interests Expressed</h3>
          <div className={styles.statNumber}>0</div>
          <Link to="/account" className={styles.statAction}>
            View Interests
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Profile Views</h3>
          <div className={styles.statNumber}>0</div>
          <Link to="/account" className={styles.statAction}>
            Update Profile
          </Link>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/investor-dashboard" className={styles.actionCard}>
            <h3>Investor Dashboard</h3>
            <p>Manage your investments and interests</p>
          </Link>
          
          <Link to="/search" className={styles.actionCard}>
            <h3>Find Investments</h3>
            <p>Search for promising investment opportunities</p>
          </Link>
          
          <Link to="/message" className={styles.actionCard}>
            <h3>Messages</h3>
            <p>Connect with entrepreneurs</p>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {isEntrepreneur() && renderEntrepreneurDashboard()}
        {isStudent() && renderStudentDashboard()}
        {isInvestor() && renderInvestorDashboard()}
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
