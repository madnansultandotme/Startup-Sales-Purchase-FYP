import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import styles from './PositionManagement.module.css';
import { positionAPI } from '../../utils/apiServices';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const PositionManagement = () => {
  const { startupId } = useParams();
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPosition, setNewPosition] = useState({
    title: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    loadPositions();
  }, [startupId]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const response = await positionAPI.getStartupPositions(startupId);
      console.log('Positions API response:', response.data);
      
      if (response.data.positions) {
        // Response has the expected format with startup and positions
        setPositions(response.data.positions || []);
        setStartup(response.data.startup);
      } else if (Array.isArray(response.data)) {
        // Response is just an array of positions
        setPositions(response.data);
        // Load startup info separately if needed
        try {
          const startupResponse = await startupAPI.getStartup(startupId);
          setStartup(startupResponse.data);
        } catch (err) {
          console.error('Failed to load startup details:', err);
        }
      } else {
        setPositions([]);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePosition = async (e) => {
    e.preventDefault();
    
    if (!newPosition.title.trim() || !newPosition.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await positionAPI.createPosition(startupId, newPosition);
      toast.success('Position created successfully!');
      setNewPosition({ title: '', description: '', requirements: '' });
      setShowCreateForm(false);
      loadPositions();
    } catch (error) {
      console.error('Failed to create position:', error);
      toast.error('Failed to create position');
    }
  };

  const handleTogglePosition = async (positionId, isActive) => {
    try {
      if (isActive) {
        await positionAPI.closePosition(positionId);
        toast.success('Position closed successfully');
      } else {
        await positionAPI.openPosition(positionId);
        toast.success('Position opened successfully');
      }
      loadPositions();
    } catch (error) {
      console.error('Failed to toggle position:', error);
      toast.error('Failed to update position status');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPosition(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loading}>Loading positions...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Team Recruitment</h1>
            {startup && (
              <div className={styles.startupInfo}>
                <h2>{startup.title}</h2>
                <p>{startup.description.substring(0, 150)}...</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
          >
            + Create New Position
          </button>
        </div>

        {showCreateForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Create New Position</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCreatePosition} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Position Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={newPosition.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Frontend Developer, Marketing Manager"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Job Description *</label>
                  <textarea
                    name="description"
                    value={newPosition.description}
                    onChange={handleInputChange}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    rows="4"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Requirements & Qualifications</label>
                  <textarea
                    name="requirements"
                    value={newPosition.requirements}
                    onChange={handleInputChange}
                    placeholder="List required skills, experience, education, etc."
                    rows="3"
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Create Position
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.positionsSection}>
          <div className={styles.sectionHeader}>
            <h3>Open Positions ({positions.filter(p => p.is_active).length})</h3>
            <p>Manage your team recruitment posts and view applications</p>
          </div>

          {positions.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No positions created yet</h4>
              <p>Create your first team recruitment post to start building your team</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className={styles.primaryButton}
              >
                Create First Position
              </button>
            </div>
          ) : (
            <div className={styles.positionsGrid}>
              {positions.map((position) => (
                <div key={position.id} className={styles.positionCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h4>{position.title}</h4>
                      <span className={`${styles.badge} ${position.is_active ? styles.active : styles.inactive}`}>
                        {position.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <p className={styles.description}>{position.description}</p>
                    
                    {position.requirements && (
                      <div className={styles.requirements}>
                        <strong>Requirements:</strong>
                        <p>{position.requirements}</p>
                      </div>
                    )}

                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>{position.applications_count || 0}</span>
                        <span className={styles.statLabel}>Applications</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>
                          {new Date(position.created_at).toLocaleDateString()}
                        </span>
                        <span className={styles.statLabel}>Posted</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Link
                      to={`/positions/${position.id}/applications`}
                      className={styles.viewButton}
                    >
                      View Applications
                    </Link>
                    <button
                      onClick={() => handleTogglePosition(position.id, position.is_active)}
                      className={`${styles.toggleButton} ${position.is_active ? styles.closeBtn : styles.openBtn}`}
                    >
                      {position.is_active ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.helpSection}>
          <h3>Tips for Better Recruitment</h3>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <h4>Be Specific</h4>
              <p>Clearly define the role, responsibilities, and required skills to attract the right candidates.</p>
            </div>
            <div className={styles.tip}>
              <h4>Highlight Benefits</h4>
              <p>Mention equity, learning opportunities, flexible work arrangements, or other perks.</p>
            </div>
            <div className={styles.tip}>
              <h4>Set Expectations</h4>
              <p>Be clear about time commitment, remote/in-person work, and compensation structure.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PositionManagement;