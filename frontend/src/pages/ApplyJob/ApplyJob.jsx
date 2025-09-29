import React, { useState, useEffect } from "react";
import styles from "./ApplyJob.module.css";
import { Navbar } from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/axiosConfig';

const ApplyJob = () => {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const { user, isStudent } = useAuth();
  const [startup, setStartup] = useState(null);
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [formData, setFormData] = useState({
    position_id: '',
    cover_letter: '',
    experience: '',
    portfolio_url: '',
    resume: null
  });

  useEffect(() => {
    if (!isStudent()) {
      toast.error('Only students can apply for positions');
      navigate('/dashboard');
      return;
    }
    loadStartupDetails();
    loadPositions();
    
    // Check if specific position was selected via URL param
    const urlParams = new URLSearchParams(window.location.search);
    const positionId = urlParams.get('position');
    if (positionId) {
      setFormData(prev => ({ ...prev, position_id: positionId }));
    }
  }, [startupId, isStudent, navigate]);

  const loadStartupDetails = async () => {
    try {
      const response = await apiClient.get(`/api/startups/${startupId}`);
      setStartup(response.data);
    } catch (error) {
      console.error('Failed to load startup details:', error);
      toast.error('Failed to load startup details');
      navigate('/collaboration');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await apiClient.get(`/api/startups/${startupId}/positions`);
      const positionData = response.data.positions || response.data;
      setPositions(positionData);
      
      // If position_id is set, find and select the position
      const positionId = formData.position_id || new URLSearchParams(window.location.search).get('position');
      if (positionId && positionData.length > 0) {
        const position = positionData.find(p => p.id === positionId);
        setSelectedPosition(position);
        if (positionId && !formData.position_id) {
          setFormData(prev => ({ ...prev, position_id: positionId }));
        }
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
      setPositions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cover_letter.trim() || !formData.experience.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.position_id && positions.length > 0) {
      toast.error('Please select a position to apply for');
      return;
    }

    setSubmitting(true);
    
    try {
      let portfolioUrl = formData.portfolio_url.trim();

      if (formData.resume) {
        try {
          setUploadingResume(true);
          const resumeData = new FormData();
          resumeData.append('file', formData.resume);

          const resumeResponse = await apiClient.post('/api/upload/resume', resumeData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          portfolioUrl = resumeResponse.data?.file_url || resumeResponse.data?.file || portfolioUrl;
        } catch (uploadError) {
          console.error('Failed to upload resume:', uploadError);
          toast.error('Failed to upload resume. Please try again.');
          return;
        } finally {
          setUploadingResume(false);
        }
      }

      const payload = {
        cover_letter: formData.cover_letter.trim(),
        experience: formData.experience.trim(),
      };

      if (formData.position_id) {
        payload.position_id = formData.position_id;
      }

      if (portfolioUrl) {
        payload.portfolio_url = portfolioUrl;
      }

      await apiClient.post(`/api/collaborations/${startupId}/apply`, payload);
      
      toast.success('Application submitted successfully! You can track the status from your dashboard.');
      setFormData({
        position_id: '',
        cover_letter: '',
        experience: '',
        portfolio_url: '',
        resume: null
      });
      setSelectedPosition(null);
      navigate('/dashboard?tab=applications');
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
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
      <h1 className={styles.title}>Apply for Collaboration</h1>
      <h2 className={styles.startupName}>{startup.title}</h2>

      {/* Tags */}
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.fund}`}>{startup.category}</span>
        <span className={`${styles.tag} ${styles.equity}`}>{startup.type}</span>
        <span className={`${styles.tag} ${styles.collab}`}>{startup.field}</span>
      </div>

      {/* Description */}
      <h3 className={styles.sectionTitle}>{selectedPosition ? 'Position' : 'Company'} Description</h3>
      <p className={styles.description}>
        {selectedPosition ? selectedPosition.description || startup.description : startup.description}
      </p>

      {selectedPosition && selectedPosition.requirements && (
        <>
          <h4 className={styles.requirementsTitle}>Requirements</h4>
          <p className={styles.requirements}>
            {selectedPosition.requirements}
          </p>
        </>
      )}

      <form onSubmit={handleSubmit}>
        {positions.length > 0 && (
          <div className={styles.formGroup}>
            <label>Select Position *</label>
            <select 
              value={formData.position_id}
              onChange={(e) => {
                const positionId = e.target.value;
                setFormData(prev => ({ ...prev, position_id: positionId }));
                const position = positions.find(p => p.id === positionId);
                setSelectedPosition(position);
              }}
              required
            >
              <option value="">Choose a position...</option>
              {positions.map(position => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.formGroup}>
          <label>Attach Resume (Optional)</label>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {formData.resume && (
            <p className={styles.fileName}>Selected: {formData.resume.name}</p>
          )}
        </div>

        <hr className={styles.divider} />

        <div className={styles.formGroup}>
          <label>Cover Letter *</label>
          <textarea 
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleInputChange}
            placeholder="Why do you want to join this team? What makes you a good fit?" 
            rows="4"
            required
          ></textarea>
        </div>

        <hr className={styles.divider} />

        <div className={styles.formGroup}>
          <label>Experience & Skills *</label>
          <textarea 
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            placeholder="Describe your relevant experience, skills, and achievements" 
            rows="4"
            required
          ></textarea>
        </div>

        <hr className={styles.divider} />

        <div className={styles.formGroup}>
          <label>Portfolio URL (Optional)</label>
          <input 
            type="url"
            name="portfolio_url"
            value={formData.portfolio_url}
            onChange={handleInputChange}
            placeholder="https://yourportfolio.com"
          />
        </div>

        <hr className={styles.divider} />
        
        <div className={styles.actionButtons}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => navigate('/collaboration')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>

</div>


    <Footer/>
    </>
  );
};

export default ApplyJob;
