import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import MarketPlaceCard from '../../components/MarketplaceCard/MarketPlaceCard';
import CollaborationCard from '../../components/CollaborationCard/CollaborationCard';
import styles from './SearchStartups.module.css';
import { searchAPI } from '../../utils/apiServices';
import { useAuth } from '../../contexts/AuthContext';

const SearchStartups = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: searchParams.get('query') || searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '', // marketplace or collaboration
    phase: searchParams.get('phase') || '',
    field: searchParams.get('field') || '',
    team_size: searchParams.get('team_size') || '',
    funding_stage: searchParams.get('funding_stage') || ''
  });
  const [totalResults, setTotalResults] = useState(0);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'saas', label: 'SaaS' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'agency', label: 'Agency' },
    { value: 'legal', label: 'Legal' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'media', label: 'Media' },
    { value: 'platform', label: 'Platform' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'robotics', label: 'Robotics' },
    { value: 'software', label: 'Software' },
    { value: 'web3', label: 'Web3' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'other', label: 'Other' }
  ];

  const types = [
    { value: '', label: 'All Types' },
    { value: 'marketplace', label: 'For Sale' },
    { value: 'collaboration', label: 'Looking for Team' }
  ];

  const phases = [
    { value: '', label: 'All Phases' },
    { value: 'Idea Stage', label: 'Idea Stage' },
    { value: 'Building MVP', label: 'Building MVP' },
    { value: 'MVP Stage', label: 'MVP Stage' },
    { value: 'Product Market Fit', label: 'Product Market Fit' },
    { value: 'Fund raising', label: 'Fund Raising' },
    { value: 'Growth', label: 'Growth' },
    { value: 'Exit', label: 'Exit' }
  ];

  const teamSizes = [
    { value: '', label: 'All Team Sizes' },
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2-5 people' },
    { value: '6-10', label: '6-10 people' },
    { value: '11-25', label: '11-25 people' },
    { value: '25+', label: '25+ people' }
  ];

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await searchAPI.searchStartups(queryParams.toString());
      setStartups(response.data.results || []);
      setTotalResults(response.data.count || 0);
    } catch (error) {
      console.error('Search failed:', error);
      setStartups([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      type: '',
      phase: '',
      field: '',
      team_size: '',
      funding_stage: ''
    });
    setSearchParams(new URLSearchParams());
    performSearch();
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Search Startups</h1>
          <p>Find startups to join, collaborate with, or invest in</p>
        </div>

        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.mainSearch}>
              <input
                type="text"
                placeholder="Search by startup name, description, or keyword..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          <div className={styles.filters}>
            <div className={styles.filterRow}>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className={styles.filterSelect}
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className={styles.filterSelect}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Industry/Field"
                value={filters.field}
                onChange={(e) => handleFilterChange('field', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterRow}>
              <select
                value={filters.phase}
                onChange={(e) => handleFilterChange('phase', e.target.value)}
                className={styles.filterSelect}
              >
                {phases.map(phase => (
                  <option key={phase.value} value={phase.value}>
                    {phase.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.team_size}
                onChange={(e) => handleFilterChange('team_size', e.target.value)}
                className={styles.filterSelect}
              >
                {teamSizes.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>

              <button 
                type="button" 
                onClick={clearFilters}
                className={styles.clearButton}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <h2>
              {totalResults > 0 
                ? `${totalResults} startups found` 
                : loading 
                  ? 'Searching...' 
                  : 'No startups found'
              }
            </h2>
          </div>

          {startups.length === 0 && !loading ? (
            <div className={styles.noResults}>
              <p>No startups match your search criteria.</p>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className={styles.startupGrid}>
              {startups.map((startup) => (
                <div key={startup.id} className={styles.startupItem}>
                  {startup.type === 'marketplace' ? (
                    <MarketPlaceCard startup={startup} />
                  ) : (
                    <CollaborationCard startup={startup} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SearchStartups;