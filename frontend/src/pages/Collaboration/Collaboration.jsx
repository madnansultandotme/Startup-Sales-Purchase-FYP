import React, { useState, useEffect } from "react";
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import CollaborationCard from "../../components/CollaborationCard/CollaborationCard";
import JobCard from "../../components/JobCard/JobCard";
import styles from "./Collaboration.module.css";
import { positionAPI } from '../../utils/apiServices';
import { useAuth } from '../../contexts/AuthContext';

const Collaboration = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    field: '',
    phase: '',
    team_size: '',
    query: ''
  });
  const { isStudent, isInvestor } = useAuth();

  useEffect(() => {
    loadPositions();
  }, [filters]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Add non-empty filter values to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params[key] = value;
        }
      });

      const response = await positionAPI.getAllPositions(params);
      
      setPositions(response.data.results || []);
    } catch (error) {
      console.error('Failed to load positions:', error);
      setPositions([]);
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

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <>
    <div className={styles.main}>

    
      <Navbar />
      <div className={styles.marketplace}>
        <div className={styles.header}>
          <h2>{isStudent() ? 'Find Jobs' : 'Job Opportunities'}</h2>

          {/* Search Bar */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search jobs by title, description, or company..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className={styles.searchInput}
            />
          </div>

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
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="saas">SaaS</option>
              <option value="ecommerce">E-commerce</option>
              <option value="agency">Agency</option>
              <option value="other">Other</option>
            </select>
            
            <input
              type="text"
              placeholder="Field/Industry"
              value={filters.field}
              onChange={(e) => handleFilterChange('field', e.target.value)}
              className={styles.filterInput}
            />
            
            <select 
              value={filters.phase} 
              onChange={(e) => handleFilterChange('phase', e.target.value)}
            >
              <option value="">All Phases</option>
              <option value="Idea Stage">Idea Stage</option>
              <option value="MVP Stage">MVP Stage</option>
              <option value="Growth">Growth</option>
              <option value="Mature">Mature</option>
            </select>
            
            <select 
              value={filters.team_size} 
              onChange={(e) => handleFilterChange('team_size', e.target.value)}
            >
              <option value="">All Team Sizes</option>
              <option value="1">Just me</option>
              <option value="2-5">2-5 people</option>
              <option value="6-10">6-10 people</option>
              <option value="11-25">11-25 people</option>
              <option value="25+">25+ people</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {loading ? (
            <div className={styles.loading}>Loading job opportunities...</div>
          ) : positions.length > 0 ? (
            positions.map((position, index) => (
              <JobCard key={position.id || index} {...position} />
            ))
          ) : (
            <div className={styles.noResults}>
              <h3>No job opportunities found</h3>
              <p>Try adjusting your filters or search terms, or check back later for new positions.</p>
            </div>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export { Collaboration };
