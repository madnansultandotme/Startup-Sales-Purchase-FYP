import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { userAPI, positionAPI } from '../../utils/apiServices';

const Dashboard = () => {
  const { user, isEntrepreneur, isStudent, isInvestor, loading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStartups, setMyStartups] = useState([]);
  const [startupIdToPositions, setStartupIdToPositions] = useState({});

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return `${styles.statusBadge} ${styles.statusApproved}`;
      case 'rejected':
        return `${styles.statusBadge} ${styles.statusRejected}`;
      case 'withdrawn':
        return `${styles.statusBadge} ${styles.statusWithdrawn}`;
      default:
        return `${styles.statusBadge} ${styles.statusPending}`;
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) {
      return 'Pending';
    }
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    // Load dashboard data when authentication is complete
    if (!authLoading && isAuthenticated) {
      if (user) {
        console.log('🏠 Dashboard: Auth complete, loading dashboard data...');
        loadDashboardData();
      } else {
        console.log('🏠 Dashboard: Authenticated but no user data yet, waiting...');
        // Set a timeout to prevent infinite waiting
        const timeout = setTimeout(() => {
          if (!user) {
            console.log('⚠️ Dashboard: User data timeout, proceeding with limited data');
            setLoading(false);
          }
        }, 5000); // 5 second timeout
        
        return () => clearTimeout(timeout);
      }
    } else if (!authLoading && !isAuthenticated) {
      console.log('🏠 Dashboard: Not authenticated');
      setLoading(false);
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

      // Save user's startups
      const startups = response.data.startups || [];
      setMyStartups(startups);

      // Fetch positions for each startup (inline listing)
      if (startups.length > 0) {
        const positionPromises = startups.map(async (s) => {
          try {
            const res = await positionAPI.getStartupPositions(s.id);
            const positions = res.data?.positions || (Array.isArray(res.data) ? res.data : []);
            return [s.id, positions];
          } catch (e) {
            return [s.id, []];
          }
        });
        const results = await Promise.all(positionPromises);
        const map = results.reduce((acc, [id, positions]) => {
          acc[id] = positions;
          return acc;
        }, {});
        setStartupIdToPositions(map);
      } else {
        setStartupIdToPositions({});
      }
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

      {/* My Positions inline */}
      <div className={styles.section}>
        <h2>My Positions</h2>
        {myStartups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You have no startups yet. Create one to start hiring.</p>
            <Link to="/createstartup" className={styles.statAction}>Create Startup</Link>
          </div>
        ) : (
          <div className={styles.listGroup}>
            {myStartups.map((s) => {
              const positions = startupIdToPositions[s.id] || [];
              const openCount = positions.filter(p => p.is_active).length;
              return (
                <div key={s.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.description?.substring(0, 120)}{(s.description && s.description.length > 120) ? '…' : ''}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <Link to={`/startups/${s.id}/positions`} className={styles.statAction}>Manage Positions</Link>
                    </div>
                  </div>
                  {positions.length === 0 ? (
                    <div className={styles.emptyRow}>
                      <span>No positions yet.</span>
                      <Link to={`/startups/${s.id}/positions`} className={styles.statAction}>Create Position</Link>
                    </div>
                  ) : (
                    <div className={styles.table}>
                      <div className={styles.tableHeader}>
                        <div>Title</div>
                        <div>Status</div>
                        <div>Applications</div>
                        <div>Posted</div>
                        <div></div>
                      </div>
                      {positions.map((p) => (
                        <div key={p.id} className={styles.tableRow}>
                          <div>{p.title}</div>
                          <div>{p.is_active ? 'Active' : 'Closed'}</div>
                          <div>{p.applications_count || 0}</div>
                          <div>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</div>
                          <div>
                            <Link to={`/positions/${p.id}/applications`} className={styles.statAction}>View Applications</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Applications</h2>
          <p>Track the latest updates on your collaboration submissions</p>
        </div>

        {recentActivity.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No applications yet</h3>
            <p>Ready to get started? Explore collaborations and apply to your favorite startups.</p>
            <Link to="/collaboration" className={styles.statAction}>
              Find Collaborations
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <div>Startup</div>
              <div>Position</div>
              <div>Status</div>
              <div>Submitted</div>
              <div></div>
            </div>
            {recentActivity.map((application) => (
              <div key={application.id} className={styles.tableRow}>
                <div>{application.startup?.title || 'Unknown Startup'}</div>
                <div>{application.position?.title || 'General Collaboration'}</div>
                <div>
                  <span className={getStatusBadgeClass(application.status)}>
                    {formatStatusLabel(application.status)}
                  </span>
                </div>
                <div>{formatDate(application.created_at)}</div>
                <div>
                  {application.startup?.id && (
                    <Link to={`/startupdetail/${application.startup.id}`} className={styles.statAction}>
                      View Startup
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

  // If we have authentication but no user data, show a basic dashboard
  const renderFallbackDashboard = () => (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h1>Welcome to your Dashboard!</h1>
        <p>Loading your profile data...</p>
      </div>
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/search" className={styles.actionCard}>
            <h3>Search</h3>
            <p>Find opportunities and startups</p>
          </Link>
          <Link to="/account" className={styles.actionCard}>
            <h3>Profile</h3>
            <p>Update your profile information</p>
          </Link>
          <Link to="/message" className={styles.actionCard}>
            <h3>Messages</h3>
            <p>Connect with others</p>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {user ? (
          <>
            {isEntrepreneur() && renderEntrepreneurDashboard()}
            {isStudent() && renderStudentDashboard()}
            {isInvestor() && renderInvestorDashboard()}
          </>
        ) : (
          renderFallbackDashboard()
        )}
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
