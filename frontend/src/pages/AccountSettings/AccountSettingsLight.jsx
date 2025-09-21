import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';

// This is the main component that renders the settings page.
const AccountSettingsLight = () => {
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

  const fade = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 500 },
  });

  // Handle the toggle for making the profile public.
  const handleToggle = () => {
    setIsProfilePublic(prev => !prev);
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

  const handleSave = () => {
    // You can implement the save logic here.
    console.log('Saving settings:', { isProfilePublic, selectedRegions, references, skills, experiences });
  };

  return (
    <>
      <style>
        {`
        body {
          background-color: #F9FAFB;
          color: #1F2937;
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
          background-color: #FFFFFF;
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
          background-color: #F9FAFB;
          border-radius: 1rem;
          padding: 1.5rem;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid #E5E7EB;
        }
        @media (min-width: 1024px) {
          .inner-card {
            padding: 2.5rem;
          }
        }
        .public-profile-section {
          width: 100%;
          border-bottom: 1px solid #E5E7EB;
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
          background-color: #D1D5DB;
          transition: .4s;
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
          background-color: #3e387f;
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
          color: #3e387f;
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
          color: #6B7280;
        }
        .region-checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid #9CA3AF;
          background-color: #F9FAFB;
          transition: background-color 0.15s;
        }
        .region-checkbox:checked {
          background-color: #3e387f;
          border-color: #3e387f;
        }
        .region-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 2px #3e387f;
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
          border: 2px solid #3e387f;
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
          background-color: rgba(255, 255, 255, 0.5);
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
          color:#1F2937;
          margin: 0;
        }
        .logout-button {
          display: none;
          align-items: center;
          color: #3e387f;
          transition: color 0.15s;
        }
        .logout-button:hover {
          color: #2e285f;
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
          color: #6B7280;
          font-size: 0.875rem;
          line-height: 1.25rem;
          margin: 0;
        }
        .profile-description {
          margin-top: 1rem;
          font-size: 0.875rem;
          line-height: 1.625;
          color: #4B5563;
        }
        .profile-description p {
          font-weight: 600;
          margin: 0;
        }
        .section-divider {
          width: 100%;
          margin-top: 2rem;
          border-top: 1px solid #E5E7EB;
          padding-top: 2rem;
        }
        .section-title {
          font-size: 1.25rem;
          line-height: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .skill-item {
          background-color: #F3F4F6;
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
          color: #3e387f;
        }
        .add-button {
          color: #3e387f;
          transition: color 0.15s;
        }
        .add-button:hover {
          color: #2e285f;
        }
        .skill-description {
          color: #6B7280;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .about-me-textarea {
          width: 100%;
          background-color: #F3F4F6;
          color: #1F2937;
          border-radius: 0.5rem;
          padding: 0.75rem;
          resize: none;
          outline: none;
          transition: all 0.15s;
        }
        .about-me-textarea:focus {
          box-shadow: 0 0 0 2px #3e387f;
        }
        .save-button {
          margin-top: 2.5rem;
          width: 100%;
          padding-left: 3rem;
          padding-right: 3rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          background-color: #3e387f;
          color: white;
          font-weight: 600;
          border-radius: 9999px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.15s;
          border: none;
          cursor: pointer;
        }
        .save-button:hover {
          background-color: #2e285f;
          transform: scale(1.05);
        }
        @media (min-width: 1024px) {
          .save-button {
            width: auto;
          }
        }
        .input-title {
          background: #E5E7EB;
          color: #1F2937;
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
          background: #E5E7EB;
          color: #1F2937;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          width: 100%;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          resize: vertical;
          outline: none;
        }
        `}
      </style>
      <animated.div style={fade} className="container">
        <div className="main-card">
          {/* Main content area */}
          <div className="content-area">
            <div className="inner-card">
              {/* User Profile Section */}
              <div className="user-profile">
                <div className="profile-picture">
                  <img
                    src="https://placehold.co/128x128/3e387f/fff?text=SAFI"
                    alt="Profile"
                  />
                  <div className="edit-overlay">
                    <span className="text-sm">Edit</span>
                  </div>
                </div>
                <div className="profile-info">
                  <div className="profile-header">
                    <h2>Safi Ullah</h2>
                    <button className="logout-button" onClick={() => console.log('Logged out.')}>
                      <span>Logout</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-16V6m6 10v-3a4 4 0 00-4-4H7a4 4 0 00-4 4v3" />
                      </svg>
                    </button>
                  </div>
                  <p>Asia, Pakistan</p>
                  <div className="profile-description">
                    <p>tldr: Safi from Pakistan is a skilled programmer with over 2 years of experience building backend solutions with Python.</p>
                  </div>
                </div>
              </div>

              {/* Make Profile Public Section */}
              <div className="section-divider">
                <div className="public-profile-header">
                  <h3 className="public-profile-title">Make profile public</h3>
                  <div className="relative">
                    <span className={`toggle-text ${isProfilePublic ? 'on' : ''}`}>
                      {isProfilePublic ? 'On' : 'Off'}
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={isProfilePublic} onChange={handleToggle} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">
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
