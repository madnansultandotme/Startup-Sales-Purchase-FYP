import React from "react";
import styles from "./JobCard.module.css";
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const JobCard = ({ id, title, description, requirements, startup, applications_count }) => {
  const { isStudent } = useAuth();
  
  // For students, link to application page. For others, show startup details
  const getLinkDestination = () => {
    if (isStudent()) {
      return `/apply-for-collaboration/${startup?.id}?position=${id}`;
    } else {
      return `/startupdetail/${startup?.id}`;
    }
  };

  return (
    <Link to={getLinkDestination()} className={styles.linkWrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.icon}>
            <img src="./briefcase.svg" alt="" />
            <h3>{title || 'Job Position'}</h3>
          </div>
          <span className={styles.tag}>{startup?.category || 'Job'}</span>
        </div>
        
        <div className={styles.jobInfo}>
          <p className={styles.company}>at {startup?.title || 'Company Name'}</p>
          <p className={styles.description}>
            {description || requirements || 'No description available'}
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statsheading}>
            Earn Through
            <p>{startup?.earn_through || 'Equity'}</p>
          </div>
          <div className={styles.statsheading}>
            Team Size  
            <p>{startup?.team_size || '1-5'}</p>
          </div>
          <div className={styles.statsheading}>
            Phase
            <p>{startup?.phase || 'Early Stage'}</p>
          </div>
        </div>

        {applications_count > 0 && (
          <div className={styles.applicationCount}>
            {applications_count} application{applications_count !== 1 ? 's' : ''}
          </div>
        )}

        {requirements && (
          <div className={styles.requirements}>
            <strong>Requirements:</strong> {requirements.length > 100 ? requirements.substring(0, 100) + '...' : requirements}
          </div>
        )}
      </div>
    </Link>
  );
};

export default JobCard;