import React from "react";
import styles from "./MarketPlaceCard.module.css";
import { Link } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';

const MarketPlaceCard = ({ id, title, description, revenue, profit, asking_price, category, type, field }) => {
  const { isStudent, isInvestor } = useAuth();
  
  // Determine the link destination based on user role
  const getLinkDestination = () => {
    if (isStudent()) {
      return `/apply-for-collaboration/${id}`;
    } else if (isInvestor()) {
      return `/startupdetail/${id}`;
    } else {
      return `/startupdetail/${id}`;
    }
  };

  return (
    <Link to={getLinkDestination()} className={styles.linkWrapper}>
    <div className={styles.card}>

      <div className={styles.cardHeader}>
        <div className={styles.icon}>
            <img src="./diamond.svg" alt="" />
            <img src="./Decentralized Network.svg" alt="" />
        <h3>{title || 'Startup Name'}</h3>
        </div>
        <span className={styles.tag}>{category || 'Marketplace'}</span>
      </div>
      <p className={styles.description}>{description || 'No description available'}</p>
      <div className={styles.stats}>
        <div className={styles.statsheading}>
          Revenue
          <p>{revenue || '$0'}</p>
        </div>
        <div className={styles.statsheading}>
          Profit
          <p>{profit || '$0'}</p>
        </div>
        <div className={styles.statsheading}>
          Asking Price
          <p>{asking_price || '$0'}</p>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default MarketPlaceCard;
