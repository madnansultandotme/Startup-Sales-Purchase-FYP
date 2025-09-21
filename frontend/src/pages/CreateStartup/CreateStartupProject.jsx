import React, { useState } from "react";
import styles from "./CreateStartupProject.module.css"; // Use CSS Module
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/axiosConfig';

const CreateStartupProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const DEBUG_SKIP_VALIDATION = true; // Set to false to enable validation
  const [formData, setFormData] = useState({
    title: '',
    role_title: '',
    description: '',
    field: '',
    website_url: '',
    stages: [],
    revenue: '',
    profit: '',
    asking_price: '',
    ttm_revenue: '',
    ttm_profit: '',
    last_month_revenue: '',
    last_month_profit: '',
    type: 'marketplace',
    earn_through: '',
    phase: '',
    team_size: '',
    category: 'saas'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? [...prev[name], e.target.value] : prev[name].filter(item => item !== e.target.value)
    }));
  };

  const handleButtonClick = (e) => {
    console.log('🚨 Button clicked!', e.type);
    console.log('🎯 Event target:', e.target);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 Form submitted! Handler called');
    console.log('📊 Current form data:', formData);
    
    if (DEBUG_SKIP_VALIDATION) {
      console.log('🚀 DEBUG MODE: Skipping validation - proceeding directly to API call');
    } else {
      // Validate required fields according to backend model
      console.log('🔍 Starting validation...');
      console.log('Title validation - Value:', formData.title, 'Length:', formData.title?.length);
      if (!formData.title || formData.title.length < 3) {
        console.log('❌ Title validation FAILED');
        toast.error('Startup name must be at least 3 characters long');
        return;
      }
      console.log('✅ Title validation PASSED');
      
      console.log('Description validation - Value:', formData.description, 'Length:', formData.description?.length);
      if (!formData.description || formData.description.length < 5) {
        console.log('❌ Description validation FAILED');
        toast.error('Description must be at least 5 characters long');
        return;
      }
      console.log('✅ Description validation PASSED');
      
      console.log('Field validation - Value:', formData.field, 'Trimmed:', formData.field?.trim());
      if (!formData.field || formData.field.trim() === '') {
        console.log('❌ Field validation FAILED');
        toast.error('Field/Industry is required');
        return;
      }
      console.log('✅ Field validation PASSED');
    }

    console.log('✅ All validations passed, proceeding with API call...');
    console.log('👤 Current user:', user);
    console.log('🔐 Authentication status:', user ? 'Authenticated' : 'Not authenticated');
    
    // DEBUG: Check token status before API call
    const accessToken = localStorage.getItem('access_token');
    const cookieToken = document.cookie.split(';').find(row => row.trim().startsWith('token='));
    console.log('🎫 DEBUG - Access token from localStorage:', accessToken ? `${accessToken.substring(0, 30)}...` : 'NOT FOUND');
    console.log('🍪 DEBUG - Token from cookies:', cookieToken ? cookieToken.substring(0, 50) + '...' : 'NOT FOUND');
    console.log('🔍 DEBUG - All cookies:', document.cookie);
    console.log('💾 DEBUG - All localStorage keys:', Object.keys(localStorage));
    
    // If no token found, show error immediately
    if (!accessToken && !cookieToken) {
      console.error('❌ CRITICAL: No authentication token found!');
      toast.error('Please login first to create a startup');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🚀 Creating startup with apiClient...');
      console.log('📋 Form data being sent:', formData);
      
      // Ensure data types match backend expectations
      const cleanedFormData = {
        ...formData,
        // Ensure stages is an array (backend expects ListField)
        stages: Array.isArray(formData.stages) ? formData.stages : [],
        // Clean empty strings to null for optional fields
        website_url: formData.website_url || null,
        revenue: formData.revenue || null,
        profit: formData.profit || null,
        asking_price: formData.asking_price || null,
        ttm_revenue: formData.ttm_revenue || null,
        ttm_profit: formData.ttm_profit || null,
        last_month_revenue: formData.last_month_revenue || null,
        last_month_profit: formData.last_month_profit || null,
        earn_through: formData.earn_through || null,
        phase: formData.phase || null,
        team_size: formData.team_size || null
      };
      
      console.log('🧺 Cleaned form data:', cleanedFormData);
      console.log('🌐 About to make API call to /api/startups...');
      
      const response = await apiClient.post('/api/startups', cleanedFormData);
      
      console.log('✅ API call successful!', response);
      console.log('📄 Response data:', response.data);
      
      toast.success('Startup created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ DETAILED ERROR ANALYSIS:');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Request config:', error.config);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', error.config?.headers);
      // Use the formData here since cleanedFormData is only defined in the try block
      console.error('Form data that was sent:', formData);
      
      // Check if this is a network error
      if (!error.response) {
        console.error('🌐 NETWORK ERROR: No response received from server');
        console.error('Possible causes:');
        console.error('- Backend server is not running');
        console.error('- Wrong API URL');
        console.error('- CORS issues');
        console.error('- Network connectivity problems');
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          JSON.stringify(error.response?.data) ||
                          error.message ||
                          'Failed to create startup. Please try again.';
      
      console.error('💬 Error message to user:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar/>
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Create Startup Project</h2>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Startup name *</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Type your startup name" 
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Role Title</label>
            <input 
              type="text" 
              name="role_title"
              value={formData.role_title}
              onChange={handleInputChange}
              placeholder="Senior web developer" 
            />
          </div>
        </div>


        <div className={styles.formGroup}>
          <label>Categories</label>
          <div className={styles.category}>
            <div className={`${styles.catg} ${formData.category === 'saas' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="saas" 
                checked={formData.category === 'saas'}
                onChange={handleInputChange}
              />
              SaaS
            </div>
            <div className={`${styles.catg} ${formData.category === 'ecommerce' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="ecommerce" 
                checked={formData.category === 'ecommerce'}
                onChange={handleInputChange}
              />
              Ecommerce
            </div>
            <div className={`${styles.catg} ${formData.category === 'agency' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="agency" 
                checked={formData.category === 'agency'}
                onChange={handleInputChange}
              />
              Agency
            </div>
            <div className={`${styles.catg} ${formData.category === 'legal' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="legal" 
                checked={formData.category === 'legal'}
                onChange={handleInputChange}
              />
              Legal
            </div>
            <div className={`${styles.catg} ${formData.category === 'marketplace' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="marketplace" 
                checked={formData.category === 'marketplace'}
                onChange={handleInputChange}
              />
              Marketplace
            </div>
            <div className={`${styles.catg} ${formData.category === 'media' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="media" 
                checked={formData.category === 'media'}
                onChange={handleInputChange}
              />
              Media
            </div>
            <div className={`${styles.catg} ${formData.category === 'platform' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="platform" 
                checked={formData.category === 'platform'}
                onChange={handleInputChange}
              />
              Platform
            </div>
            <div className={`${styles.catg} ${formData.category === 'real_estate' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="real_estate" 
                checked={formData.category === 'real_estate'}
                onChange={handleInputChange}
              />
              Real Estate
            </div>
            <div className={`${styles.catg} ${formData.category === 'robotics' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="robotics" 
                checked={formData.category === 'robotics'}
                onChange={handleInputChange}
              />
              Robotics
            </div>
            <div className={`${styles.catg} ${formData.category === 'software' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="software" 
                checked={formData.category === 'software'}
                onChange={handleInputChange}
              />
              Software
            </div>
            <div className={`${styles.catg} ${formData.category === 'web3' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="web3" 
                checked={formData.category === 'web3'}
                onChange={handleInputChange}
              />
              Web3
            </div>
            <div className={`${styles.catg} ${formData.category === 'crypto' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="crypto" 
                checked={formData.category === 'crypto'}
                onChange={handleInputChange}
              />
              Crypto
            </div>
            <div className={`${styles.catg} ${formData.category === 'other' ? styles.selected : ''}`}>
              <input 
                type="radio" 
                name="category" 
                value="other" 
                checked={formData.category === 'other'}
                onChange={handleInputChange}
              />
              Other
            </div>
          </div>
          
          <label>Startup Description *</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Write a description here" 
            rows="4"
            required
          ></textarea>
          
          <label>Field/Industry *</label>
          <input 
            type="text" 
            name="field"
            value={formData.field}
            onChange={handleInputChange}
            placeholder="e.g., Technology, Healthcare, Finance" 
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Stage of your startup</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Idea Stage"
                checked={formData.stages.includes('Idea Stage')}
                onChange={handleCheckboxChange}
              /> Idea Stage
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Building MVP"
                checked={formData.stages.includes('Building MVP')}
                onChange={handleCheckboxChange}
              /> Building MVP
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="MVP Stage"
                checked={formData.stages.includes('MVP Stage')}
                onChange={handleCheckboxChange}
              /> MVP Stage
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Product Market Fit"
                checked={formData.stages.includes('Product Market Fit')}
                onChange={handleCheckboxChange}
              /> Product Market Fit
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Fund raising"
                checked={formData.stages.includes('Fund raising')}
                onChange={handleCheckboxChange}
              /> Fund raising
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Growth"
                checked={formData.stages.includes('Growth')}
                onChange={handleCheckboxChange}
              /> Growth
            </label>
            <label className={styles.checkboxlabel}>
              <input 
                type="checkbox" 
                name="stages"
                value="Exit"
                checked={formData.stages.includes('Exit')}
                onChange={handleCheckboxChange}
              /> Exit
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Startup Type</label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleInputChange}
          >
            <option value="marketplace">Marketplace (For Sale)</option>
            <option value="collaboration">Collaboration (Looking for Team)</option>
          </select>
        </div>

        {/* Conditional fields based on type */}
        {formData.type === 'marketplace' && (
          <>
            <h3>Marketplace Information (For Sale)</h3>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Website URL</label>
                <input 
                  type="url" 
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  placeholder="https://demowebsite.com" 
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Current Phase</label>
                <input 
                  type="text" 
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  placeholder="e.g., Seed Stage, Series A" 
                  required
                />
              </div>
            </div>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Team Size</label>
                <input 
                  type="text" 
                  name="team_size"
                  value={formData.team_size}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-5 people" 
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>How do you earn?</label>
                <input 
                  type="text" 
                  name="earn_through"
                  value={formData.earn_through}
                  onChange={handleInputChange}
                  placeholder="e.g., Subscriptions, Sales, Ads" 
                  required
                />
              </div>
            </div>
            
            <h4>Financial Information (Optional)</h4>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Current Revenue (Optional)</label>
                <input 
                  type="text" 
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  placeholder="e.g., $10,000/month" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Current Profit (Optional)</label>
                <input 
                  type="text" 
                  name="profit"
                  value={formData.profit}
                  onChange={handleInputChange}
                  placeholder="e.g., $5,000/month" 
                />
              </div>
            </div>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Asking Price (Optional)</label>
                <input 
                  type="text" 
                  name="asking_price"
                  value={formData.asking_price}
                  onChange={handleInputChange}
                  placeholder="e.g., $100,000" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>TTM Revenue (Optional)</label>
                <input 
                  type="text" 
                  name="ttm_revenue"
                  value={formData.ttm_revenue}
                  onChange={handleInputChange}
                  placeholder="e.g., $120,000" 
                />
              </div>
            </div>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>TTM Profit (Optional)</label>
                <input 
                  type="text" 
                  name="ttm_profit"
                  value={formData.ttm_profit}
                  onChange={handleInputChange}
                  placeholder="e.g., $60,000" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Month Revenue (Optional)</label>
                <input 
                  type="text" 
                  name="last_month_revenue"
                  value={formData.last_month_revenue}
                  onChange={handleInputChange}
                  placeholder="e.g., $12,000" 
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Last Month Profit (Optional)</label>
              <input 
                type="text" 
                name="last_month_profit"
                value={formData.last_month_profit}
                onChange={handleInputChange}
                placeholder="e.g., $6,000" 
              />
            </div>
          </>
        )}

        {formData.type === 'collaboration' && (
          <>
            <h3>Collaboration Details (Looking for Team)</h3>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Website URL</label>
                <input 
                  type="url" 
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  placeholder="https://demowebsite.com" 
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Current Phase</label>
                <input 
                  type="text" 
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  placeholder="e.g., Seed Stage, Series A, Idea Stage" 
                  required
                />
              </div>
            </div>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Current Team Size</label>
                <input 
                  type="text" 
                  name="team_size"
                  value={formData.team_size}
                  onChange={handleInputChange}
                  placeholder="e.g., 1-2 people, Just me" 
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>How will team members earn?</label>
                <input 
                  type="text" 
                  name="earn_through"
                  value={formData.earn_through}
                  onChange={handleInputChange}
                  placeholder="e.g., Equity, Revenue Share, Salary" 
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.actionButtons}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
            onClick={handleButtonClick}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>

<Footer/>
    </>
  );
};

export default CreateStartupProject;
