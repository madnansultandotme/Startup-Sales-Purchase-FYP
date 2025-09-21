import React, { useState, useEffect } from "react";
import styles from "./StartupDetails.module.css";
import { Navbar } from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { startupAPI, userAPI } from '../../utils/apiServices';

const StartupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStudent, isInvestor, isEntrepreneur } = useAuth();
  const [startup, setStartup] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');

  useEffect(() => {
    loadStartupDetails();
    loadPositions();
    checkFavoriteStatus();
    checkInterestStatus();
  }, [id]);

  const loadStartupDetails = async () => {
    try {
      const response = await startupAPI.getStartup(id);
      setStartup(response.data);
    } catch (error) {
      console.error('Failed to load startup details:', error);
      toast.error('Failed to load startup details');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await startupAPI.getStartupPositions(id);
      // Handle both response formats
      if (response.data.positions) {
        setPositions(response.data.positions.filter(pos => pos.is_active));
      } else if (Array.isArray(response.data)) {
        setPositions(response.data.filter(pos => pos.is_active));
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
      // Don't show error for this, positions might not exist
      setPositions([]);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !isInvestor()) return;
    
    try {
      const response = await userAPI.getUserFavorites();
      const isFav = response.data.some(fav => fav.startup.id === id);
      setIsFavorited(isFav);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      // Don't show error to user for this non-critical operation
    }
  };

  const checkInterestStatus = async () => {
    if (!user || !isInvestor()) return;
    
    try {
      const response = await userAPI.getUserInterests();
      const hasInt = response.data.some(interest => interest.startup.id === id);
      setHasInterest(hasInt);
    } catch (error) {
      console.error('Failed to check interest status:', error);
      // Don't show error to user for this non-critical operation
    }
  };

  const toggleFavorite = async () => {
    // Check if user is authenticated
    if (!user || !isInvestor()) {
      toast.error('Please log in as an investor to use favorites');
      navigate('/login');
      return;
    }

    try {
      await startupAPI.toggleFavorite(id);
      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      
      // Handle specific authentication errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Please log in to use favorites');
        navigate('/login');
      } else {
        toast.error('Failed to update favorites');
      }
    }
  };

  const expressInterest = async () => {
    // Check if user is authenticated
    if (!user || !isInvestor()) {
      toast.error('Please log in as an investor to express interest');
      navigate('/login');
      return;
    }

    if (!interestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await startupAPI.expressInterest(id, { message: interestMessage });
      setHasInterest(true);
      setInterestMessage('');
      toast.success('Interest expressed successfully!');
    } catch (error) {
      console.error('Failed to express interest:', error);
      
      // Handle specific authentication errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Please log in to express interest');
        navigate('/login');
      } else {
        toast.error('Failed to express interest');
      }
    }
  };
  if (loading) {
    return (
      <>
        <Navbar/>
        <div className={styles.container}>
          <div className={styles.loading}>Loading startup details...</div>
        </div>
        <Footer/>
      </>
    );
  }

  if (!startup) {
    return (
      <>
        <Navbar/>
        <div className={styles.container}>
          <div className={styles.error}>Startup not found</div>
        </div>
        <Footer/>
      </>
    );
  }

  return (
    <>
    <Navbar/>
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.title}>{startup.title}</h1>

      {/* Tags */}
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.fund}`}>{startup.category}</span>
        <span className={`${styles.tag} ${styles.equity}`}>{startup.type}</span>
        <span className={`${styles.tag} ${styles.collab}`}>{startup.field}</span>
      </div>

      {/* Investor Actions */}
      {isInvestor() && (
        <div className={styles.investorActions}>
          <button 
            className={`${styles.actionBtn} ${isFavorited ? styles.favorited : ''}`}
            onClick={toggleFavorite}
          >
            {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>
          
          {!hasInterest && (
            <div className={styles.interestSection}>
              <textarea
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                placeholder="Express your interest in this startup..."
                className={styles.interestInput}
                rows="3"
              />
              <button 
                className={styles.actionBtn}
                onClick={expressInterest}
              >
                Express Interest
              </button>
            </div>
          )}
          
          {hasInterest && (
            <div className={styles.interestStatus}>
              ✅ Interest expressed
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <h3 className={styles.sectionTitle}>Description</h3>
      <p className={styles.description}>
        {startup.description}
      </p>

      <hr className={styles.divider} />

      {/* Recent Performance */}
      <h3 className={styles.sectionTitle}>Recent Performance</h3>
      <div className={styles.performance}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>TTM REVENUE</span>
          <div className={styles.metricLabel2}>
            <img src="./Get Revenue.svg" alt="" />
            <p className={styles.metricValue}>{startup.performance?.ttmRevenue || startup.ttm_revenue || '$0'}</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>TTM PROFIT</span>
          <div className={styles.metricLabel2}>
            <img src="./Stocks Growth.svg" alt="" />
            <p className={styles.metricValue}>{startup.performance?.ttmProfit || startup.ttm_profit || '$0'}</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>LAST MONTH REVENUE</span>
          <div className={styles.metricLabel2}>
            <img src="./Profit.svg" alt="" />
            <p className={styles.metricValue}>{startup.performance?.lastMonthRevenue || startup.last_month_revenue || '$0'}</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>LAST MONTH PROFIT</span>
          <div className={styles.metricLabel2}>
            <img src="./Weak Financial Growth.svg" alt="" />
            <p className={styles.metricValue}>{startup.performance?.lastMonthProfit || startup.last_month_profit || '$0'}</p>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Positions */}
      <h3 className={styles.sectionTitle}>Available Positions</h3>
      <div className={styles.positions}>
        {positions.length > 0 ? (
          positions.map((position) => (
            <div key={position.id} className={styles.positionCard}>
              <h4 className={styles.positionTitle}>{position.title}</h4>
              <p className={styles.positionDescription}>{position.description}</p>
              {position.requirements && (
                <p className={styles.positionRequirements}>
                  <strong>Requirements:</strong> {position.requirements}
                </p>
              )}
              {isStudent() && (
                <Link 
                  to={`/apply-for-collaboration/${id}?position=${position.id}`} 
                  className={styles.applyButton}
                >
                  Apply for this Position
                </Link>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noPositions}>
            {startup?.type === 'collaboration' 
              ? 'No open positions at the moment. Check back later!' 
              : 'This startup is not currently looking for team members.'}
          </div>
        )}
      </div>
      
      {/* Entrepreneur Actions */}
      {isEntrepreneur() && user?.id === startup?.owner?.id && (
        <div className={styles.entrepreneurActions}>
          <Link to={`/startups/${id}/positions`} className={styles.manageButton}>
            Manage Positions
          </Link>
        </div>
      )}
    </div>

    <Footer/>
    </>
  );
};

export default StartupDetails;
