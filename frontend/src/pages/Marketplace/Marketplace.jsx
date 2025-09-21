import React, { useState, useEffect } from "react";
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import MarketPlaceCard from "../../components/MarketPlaceCard/MarketPlaceCard";
import styles from "./MarketPlace.module.css";
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';

const Marketplace = () => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sortBy: 'date',
    order: 'desc',
    type: '',
    minRevenue: '',
    maxRevenue: ''
  });
  const { isInvestor, isStudent } = useAuth();

  useEffect(() => {
    loadStartups();
  }, [filters]);

  const loadStartups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.order) params.append('order', filters.order);
      if (filters.type) params.append('type', filters.type);
      if (filters.minRevenue) params.append('minRevenue', filters.minRevenue);
      if (filters.maxRevenue) params.append('maxRevenue', filters.maxRevenue);

      const response = await axios.get(`${API_BASE_URL}/api/marketplace?${params}`, {
        withCredentials: true
      });
      
      setStartups(response.data.results || []);
    } catch (error) {
      console.error('Failed to load startups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <>
    <div className={styles.main}>

    
      <Navbar />
      <div className={styles.marketplace}>
        <div className={styles.header}>
          <h2>Explore Marketplace</h2>

          {/* Mobile Filter Toggle Button */}
          <button className={styles.filterToggle} onClick={toggleFilters}>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Filters Section */}
          <div
            className={`${styles.filters} ${
              showFilters ? styles.showFilters : ""
            }`}
          >
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
              <option value="revenue">Sort by Revenue</option>
            </select>
            
            <select 
              value={filters.order} 
              onChange={(e) => handleFilterChange('order', e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="saas">SaaS</option>
              <option value="ecommerce">Ecommerce</option>
              <option value="agency">Agency</option>
              <option value="other">Other</option>
            </select>
            
            <input
              type="number"
              placeholder="Min Revenue"
              value={filters.minRevenue}
              onChange={(e) => handleFilterChange('minRevenue', e.target.value)}
            />
            
            <input
              type="number"
              placeholder="Max Revenue"
              value={filters.maxRevenue}
              onChange={(e) => handleFilterChange('maxRevenue', e.target.value)}
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {loading ? (
            <div className={styles.loading}>Loading startups...</div>
          ) : startups.length > 0 ? (
            startups.map((startup, index) => (
              <MarketPlaceCard key={startup.id || index} {...startup} />
            ))
          ) : (
            <div className={styles.noResults}>
              <h3>No startups found</h3>
              <p>Try adjusting your filters or check back later for new listings.</p>
            </div>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export { Marketplace };
