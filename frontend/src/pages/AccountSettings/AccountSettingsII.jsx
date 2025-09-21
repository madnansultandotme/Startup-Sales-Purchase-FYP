import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import {Navbar} from "../../components/Navbar/Navbar"
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, applicationAPI } from '../../utils/apiServices';

// This is the main component that renders the settings page.
const App = () => {
  const { user, isStudent, isEntrepreneur, isInvestor, logout } = useAuth();
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState({
    Africa: false,
    Asia: false,
    Australia: false,
    Europe: false,
    'North America': false,
    'South America': false,
  });

  const [references, setReferences] = useState([
    { title: 'Programming (Python)', description: "I've been building backend solutions with Python for over 2 years." },
  ]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);

  // Application management state
  const [applications, setApplications] = useState([]);
  const [startupApplications, setStartupApplications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [interests, setInterests] = useState([]);
  const [profileStats, setProfileStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile data
      const profileResponse = await userAPI.getProfileData();
      
      const data = profileResponse.data;
      
      // Update profile state
      if (data.profile) {
        setIsProfilePublic(data.profile.is_public || false);
        setSelectedRegions(data.profile.selected_regions || {
          Africa: false,
          Asia: false,
          Australia: false,
          Europe: false,
          'North America': false,
          'South America': false,
        });
        setSkills(data.profile.skills || []);
        setExperiences(data.profile.experience || []);
        setReferences(data.profile.references || []);
      }
      
      // Update stats
      if (data.stats) {
        setProfileStats(data.stats);
      }
      
      // Load role-specific data
      if (isStudent()) {
        setApplications(data.applications || []);
        setFavorites(data.favorites || []);
      } else if (isEntrepreneur()) {
        setStartupApplications(data.applications || []);
      } else if (isInvestor()) {
        setFavorites(data.favorites || []);
        setInterests(data.interests || []);
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fade = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 500 },
  });

  // Handle the toggle for making the profile public.
  const handleToggle = () => {
    setIsProfilePublic(prev => !prev);
  };

  // Application management functions
  const handleApproveApplication = async (applicationId) => {
    try {
      await applicationAPI.approveApplication(applicationId);
      toast.success('Application approved');
      loadUserData(); // Reload data
    } catch (error) {
      console.error('Failed to approve application:', error);
      toast.error('Failed to approve application');
    }
  };

  const handleDeclineApplication = async (applicationId) => {
    try {
      await applicationAPI.declineApplication(applicationId);
      toast.success('Application declined');
      loadUserData(); // Reload data
    } catch (error) {
      console.error('Failed to decline application:', error);
      toast.error('Failed to decline application');
    }
  };

  const handleSave = async () => {
    try {
      const profileData = {
        is_public: isProfilePublic,
        selected_regions: selectedRegions,
        skills: skills,
        experience: experiences,
        references: references
      };

      await userAPI.updateProfileData(profileData);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Handle the checkbox state for region selection.
  const handleRegionChange = (region) => {
    setSelectedRegions(prev => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  // Generic handler to add a new item to a specific list.
  const handleAddItem = (type) => {
    const newItem = { title: '', description: '' };
    if (type === 'references') {
      setReferences(prev => [...prev, newItem]);
    } else if (type === 'skills') {
      setSkills(prev => [...prev, newItem]);
    } else if (type === 'experiences') {
      setExperiences(prev => [...prev, newItem]);
    }
  };

  // Generic handler to remove an item from a specific list.
  const handleRemoveItem = (type, index) => {
    if (type === 'references') {
      setReferences(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'skills') {
      setSkills(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'experiences') {
      setExperiences(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Generic handler to update an item's content in a specific list.
  const handleItemChange = (type, index, field, value) => {
    const setter = type === 'references' ? setReferences : type === 'skills' ? setSkills : setExperiences;
    setter(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <>
    
      <style>
        {`
        body {
          background-color: #111827;
          color: #F3F4F6;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          margin: 0;
          padding: 0;
        }
        .container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }
        @media (min-width: 640px) {
          .container {
            padding: 2rem;
          }
        }
        .main-card {
          background-color: #1F2937;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 1.5rem;
          width: 100%;
          max-width: 56rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .main-card {
            padding: 2.5rem;
          }
        }
        @media (min-width: 1024px) {
          .main-card {
            flex-direction: row;
          }
        }
        .content-area {
          flex: 1 1 0%;
        }
        .inner-card {
          background-color: #111827;
          border-radius: 1rem;
          padding: 1.5rem;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid #374151;
        }
        @media (min-width: 1024px) {
          .inner-card {
            padding: 2.5rem;
          }
        }
        .public-profile-section {
          width: 100%;
          border-bottom: 1px solid #374151;
          padding-bottom: 2rem;
          margin-bottom: 2rem;
        }
        .public-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .public-profile-title {
          font-weight: 600;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 3.5rem;
          height: 1.5rem;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: .4s;
    height: 1.5rem;
    margin-top:2rem;
    width: 3.5rem;
    border-radius: 9999px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 1.25rem;
          width: 1.25rem;
          left: 0.125rem;
          bottom: 0.125rem;
          background-color: white;
          transition: .4s;
          border-radius: 9999px;
        }
        input:checked + .slider {
          background-color: #8B5CF6;
        }
        input:checked + .slider:before {
          transform: translateX(2rem);
        }
        .toggle-text {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 4rem;
          font-weight: 600;
          color: #9CA3AF;
        }
        .toggle-text.on {
          right: -2rem;
          color: white;
        }
        .toggle-options {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .region-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #9CA3AF;
        }
        .region-checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid #4B5563;
          background-color: #111827;
          transition: background-color 0.15s;
        }
        .region-checkbox:checked {
          background-color: #8B5CF6;
          border-color: #8B5CF6;
        }
        .region-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 2px #A855F7;
        }

        .user-profile {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .user-profile {
            flex-direction: row;
          }
        }
        .profile-picture {
          position: relative;
          width: 6rem;
          height: 6rem;
          border-radius: 9999px;
          overflow: hidden;
          border: 2px solid #8B5CF6;
        }
        @media (min-width: 640px) {
          .profile-picture {
            width: 8rem;
            height: 8rem;
          }
        }
        .profile-picture img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .edit-overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-color: rgba(17, 24, 39, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          cursor: pointer;
        }
        .profile-picture:hover .edit-overlay {
          opacity: 1;
        }
        .profile-info {
          flex: 1 1 0%;
          text-align: center;
        }
        @media (min-width: 640px) {
          .profile-info {
            text-align: left;
          }
        }
        .profile-header {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        @media (min-width: 640px) {
          .profile-header {
            justify-content: space-between;
          }
        }
        .profile-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 2rem;
          color:#fff;
          margin: 0;
        }
        .logout-button {
          display: none;
          align-items: center;
          color: #A855F7;
          transition: color 0.15s;
        }
        .logout-button:hover {
          color: #C084FC;
        }
        @media (min-width: 640px) {
          .logout-button {
            display: inline-flex;
          }
        }
        .logout-button svg {
          height: 1rem;
          width: 1rem;
          margin-left: 0.5rem;
        }
        .profile-info p {
          color: #9CA3AF;
          font-size: 0.875rem;
          line-height: 1.25rem;
          margin: 0;
        }
        .profile-description {
          margin-top: 1rem;
          font-size: 0.875rem;
          line-height: 1.625;
          color: #D1D5DB;
        }
        .profile-description p {
          font-weight: 600;
          margin: 0;
        }
        .section-divider {
          width: 100%;
          margin-top: 2rem;
          border-top: 1px solid #374151;
          padding-top: 2rem;
        }
        .section-title {
          font-size: 1.25rem;
          line-height: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .skill-item {
          background-color: #1F2937;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .skill-header p {
          font-size: 1.125rem;
          line-height: 1.75rem;
          font-weight: 600;
          color: #D8B4FE;
        }
        .add-button {
          color: #A855F7;
          transition: color 0.15s;
        }
        .add-button:hover {
          color: #C084FC;
        }
        .skill-description {
          color: #9CA3AF;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .about-me-textarea {
          width: 100%;
          background-color: #1F2937;
          color: #E5E7EB;
          border-radius: 0.5rem;
          padding: 0.75rem;
          resize: none;
          outline: none;
          transition: all 0.15s;
        }
        .about-me-textarea:focus {
          box-shadow: 0 0 0 2px #A855F7;
        }
        .save-button {
          margin-top: 2.5rem;
          width: 100%;
          padding-left: 3rem;
          padding-right: 3rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          background-color: #7C3AED;
          color: white;
          font-weight: 600;
          border-radius: 9999px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.15s;
          border: none;
          cursor: pointer;
        }
        .save-button:hover {
          background-color: #6D28D9;
          transform: scale(1.05);
        }
        @media (min-width: 1024px) {
          .save-button {
            width: auto;
          }
        }
        .input-title {
          background: #374151;
          color: #E5E7EB;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          width: 100%;
          font-size: 1.125rem;
          font-weight: 600;
          outline: none;
        }
        .remove-button {
          background: transparent;
          border: none;
          color: #EF4444;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: color 0.15s;
        }
        .remove-button:hover {
          color: #DC2626;
        }
        .input-description {
          background: #374151;
          color: #E5E7EB;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          width: 100%;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          resize: vertical;
          outline: none;
        }
        
        /* Application Management Styles */
        .application-section {
          width: 100%;
          margin-bottom: 2rem;
          border-top: 1px solid #374151;
          padding-top: 2rem;
        }
        
        .section-title {
          color: #F3F4F6;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .application-card {
          background-color: #111827;
          border: 1px solid #374151;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }
        
        .application-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .application-header h4 {
          color: #F3F4F6;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }
        
        .status {
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-pending {
          background-color: #FEF3C7;
          color: #92400E;
        }
        
        .status-approved {
          background-color: #D1FAE5;
          color: #065F46;
        }
        
        .status-rejected {
          background-color: #FEE2E2;
          color: #991B1B;
        }
        
        .status-favorite {
          background-color: #FCE7F3;
          color: #BE185D;
        }
        
        .status-interest {
          background-color: #E0E7FF;
          color: #3730A3;
        }
        
        .application-description {
          color: #D1D5DB;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        
        .application-date {
          color: #9CA3AF;
          font-size: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .application-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .approve-btn, .decline-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .approve-btn {
          background-color: #10B981;
          color: white;
        }
        
        .approve-btn:hover {
          background-color: #059669;
        }
        
        .decline-btn {
          background-color: #EF4444;
          color: white;
        }
        
        .decline-btn:hover {
          background-color: #DC2626;
        }
        `}
      </style>
      <Navbar/>
      <animated.div style={fade} className="container">
        <div className="main-card">
          {/* Main content area */}
          <div className="content-area">
            <div className="inner-card">
              {/* Make Profile Public Section */}
              <div className="public-profile-section">
                <div className="public-profile-header">
                  <h3 className="public-profile-title">Make profile public</h3>
                  <div className="relative">
                    <span className={`toggle-text ${isProfilePublic ? 'on' : ''}`}>
                      {/* {isProfilePublic ? 'On' : 'Off'} */}
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={isProfilePublic} onChange={handleToggle} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Below, you can select the regions in which your profile is visible and where you can receive project invitations.
                </p>
                <div className="toggle-options">
                  {Object.keys(selectedRegions).map(region => (
                    <div key={region} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`region-${region}`}
                        name="regions"
                        value={region}
                        checked={selectedRegions[region]}
                        onChange={() => handleRegionChange(region)}
                        className="region-checkbox"
                      />
                      <label htmlFor={`region-${region}`} className="region-checkbox-label">
                        {region}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {/* User Profile Section */}
              <div className="user-profile">
                <div className="profile-picture">
                  <img
                    src={`https://placehold.co/128x128/333/fff?text=${user?.username?.charAt(0)?.toUpperCase() || 'U'}`}
                    alt={`${user?.username || 'User'} profile`}
                  />
                  <div className="edit-overlay">
                    <span className="text-sm">Edit</span>
                  </div>
                </div>
                <div className="profile-info">
                  <div className="profile-header">
                    <h2>{user?.username || 'Unknown User'}</h2>
                    <button 
                      className="logout-button"
                      onClick={logout}
                      title="Logout"
                    >
                      <span>Logout</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-16V6m6 10v-3a4 4 0 00-4 4H7a4 4 0 00-4 4v3" />
                      </svg>
                    </button>
                  </div>
                  <p>{user?.email || 'No email'} {user?.role && `• ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`}</p>
                  <div className="profile-description">
                    <p>{loading ? 'Loading profile...' : (user ? `${user.username} is a ${user.role} on our platform.` : 'No user information available.')}</p>
                    {!loading && profileStats && (
                      <div className="profile-stats" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#9CA3AF' }}>
                        {isStudent() && (
                          <span>Applications: {profileStats.applications_submitted || 0}</span>
                        )}
                        {isEntrepreneur() && (
                          <span>Startups: {profileStats.startups_created || 0}</span>
                        )}
                        {isInvestor() && (
                          <span>Favorites: {profileStats.favorites_count || 0}</span>
                        )}
                        <span>Member since: {user?.created_at ? new Date(user.created_at).getFullYear() : 'Unknown'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Top Skills Section */}
              <div className="section-divider">
                <div className="skill-header">
                  <h3 className="section-title">Top Skill</h3>
                  <button onClick={() => handleAddItem('references')} className="add-button">
                    <span className="text-sm">+ Add Reference</span>
                  </button>
                </div>
                {references.map((item, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-header">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange('references', index, 'title', e.target.value)}
                        placeholder="Reference Title"
                        className="input-title"
                      />
                      <button onClick={() => handleRemoveItem('references', index)} className="remove-button">
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange('references', index, 'description', e.target.value)}
                      placeholder="Reference Details"
                      className="input-description"
                      rows="2"
                    ></textarea>
                  </div>
                ))}
              </div>
              {/* Skills & Hobbies Section */}
              <div className="section-divider">
                <div className="skill-header">
                  <h3 className="section-title">Skills & Hobbies</h3>
                  <button onClick={() => handleAddItem('skills')} className="add-button">
                    <span className="text-sm">+ Add skill</span>
                  </button>
                </div>
                {skills.map((item, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-header">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange('skills', index, 'title', e.target.value)}
                        placeholder="Skill Name"
                        className="input-title"
                      />
                      <button onClick={() => handleRemoveItem('skills', index)} className="remove-button">
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange('skills', index, 'description', e.target.value)}
                      placeholder="Skill Details"
                      className="input-description"
                      rows="2"
                    ></textarea>
                  </div>
                ))}
              </div>
              {/* Business Experience Section */}
              <div className="section-divider">
                <div className="skill-header">
                  <h3 className="section-title">Business Experience</h3>
                  <button onClick={() => handleAddItem('experiences')} className="add-button">
                    <span className="text-sm">+ Add Business Experience</span>
                  </button>
                </div>
                {experiences.map((item, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-header">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange('experiences', index, 'title', e.target.value)}
                        placeholder="Company/Role"
                        className="input-title"
                      />
                      <button onClick={() => handleRemoveItem('experiences', index)} className="remove-button">
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange('experiences', index, 'description', e.target.value)}
                      placeholder="Experience Details"
                      className="input-description"
                      rows="2"
                    ></textarea>
                  </div>
                ))}
              </div>

              {/* Application Management Sections */}
              {isStudent() && applications.length > 0 && (
                <div className="application-section">
                  <h3 className="section-title">My Applications</h3>
                  <div className="applications-list">
                    {applications.map((app) => (
                      <div key={app.id} className="application-card">
                        <div className="application-header">
                          <h4>{app.startup?.title || 'Startup'}</h4>
                          <span className={`status status-${app.status}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="application-description">
                          {app.cover_letter?.substring(0, 100)}...
                        </p>
                        <div className="application-date">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isEntrepreneur() && startupApplications.length > 0 && (
                <div className="application-section">
                  <h3 className="section-title">Applications to My Startups</h3>
                  <div className="applications-list">
                    {startupApplications.map((app) => (
                      <div key={app.id} className="application-card">
                        <div className="application-header">
                          <h4>{app.applicant?.username || 'Applicant'}</h4>
                          <span className={`status status-${app.status}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="application-description">
                          {app.cover_letter?.substring(0, 100)}...
                        </p>
                        <div className="application-actions">
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApproveApplication(app.id)}
                                className="approve-btn"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleDeclineApplication(app.id)}
                                className="decline-btn"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isInvestor() && (
                <>
                  {favorites.length > 0 && (
                    <div className="application-section">
                      <h3 className="section-title">My Favorites</h3>
                      <div className="applications-list">
                        {favorites.map((fav) => (
                          <div key={fav.id} className="application-card">
                            <div className="application-header">
                              <h4>{fav.startup?.title || 'Startup'}</h4>
                              <span className="status status-favorite">
                                Favorited
                              </span>
                            </div>
                            <p className="application-description">
                              {fav.startup?.description?.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interests.length > 0 && (
                    <div className="application-section">
                      <h3 className="section-title">My Interests</h3>
                      <div className="applications-list">
                        {interests.map((interest) => (
                          <div key={interest.id} className="application-card">
                            <div className="application-header">
                              <h4>{interest.startup?.title || 'Startup'}</h4>
                              <span className="status status-interest">
                                Interest Expressed
                              </span>
                            </div>
                            <p className="application-description">
                              {interest.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="save-button"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      </animated.div>
    </>
  );
};

export default App;
