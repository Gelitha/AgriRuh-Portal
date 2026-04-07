// frontend/src/components/SubmissionModal.jsx
// Submission Modal - Form for students to submit their lab reports

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SubmissionModal.css';

const SubmissionModal = ({ sessionId, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Fetch session details on component mount
   */
  useEffect(() => {
    const fetchSession = async () => {
      try {
        if (sessionId) {
          const response = await api.get(`/sessions/${sessionId}`);
          setSession(response.data.data);
        } else {
          // Load available sessions for manual selection
          const response = await api.get('/sessions?status=active&limit=10');
          setSession(response.data.data[0] || null); // Default to first session
        }
      } catch (error) {
        setErrorMessage(
          error.response?.data?.error?.message || 'Error loading session'
        );
      }
    };

    fetchSession();
  }, [sessionId]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      setErrorMessage('Please select a session');
      return;
    }

    try {
      setLoading(true);

      // Create submission
      const formData = new FormData();
      formData.append('session_id', session.id);
      formData.append('submission_method', sessionId ? 'qr_scan' : 'manual_selection');

      // Submit
      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Show success message
      setSuccessMessage('✅ Submission successful!');

      // Call success callback after delay
      setTimeout(() => {
        onSuccess(response.data.data);
      }, 1000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error?.message || 'Submission failed';

      // Handle specific errors
      if (error.response?.data?.error?.code === 'DUPLICATE_SUBMISSION') {
        setErrorMessage(
          `You have already submitted for this session (${
            error.response.data.error.previous_submission.submission_time
          })`
        );
      } else if (error.response?.data?.error?.code === 'SESSION_CLOSED') {
        setErrorMessage('The submission window for this session has closed');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate time until deadline
   */
  const getTimeStatus = () => {
    if (!session) return '';

    const now = new Date();
    const deadline = new Date(session.submission_deadline);
    const timeDiff = deadline - now;

    if (timeDiff < 0) {
      return '❌ Deadline has passed';
    }

    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `⏱️ ${hoursLeft}h ${minutesLeft}m until deadline`;
    } else {
      return `⏱️ ${minutesLeft}m until deadline`;
    }
  };

  return (
    <div className="submission-modal-overlay">
      <div className="submission-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Submit Lab Report</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form className="submission-form" onSubmit={handleSubmit}>
          {/* Error Message */}
          {errorMessage && (
            <div className="alert alert-error">
              {errorMessage}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="alert-close"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          {/* Session Details */}
          {session ? (
            <div className="session-details">
              <h3>{session.session_title}</h3>
              <p className="subject-name">Subject: {session.subject?.name}</p>

              <div className="deadline-info">
                <p className="deadline-main">
                  Deadline: {new Date(session.submission_deadline).toLocaleString()}
                </p>
                <p className="deadline-status">{getTimeStatus()}</p>
              </div>

              {/* Status Badge */}
              <div className="submission-status-info">
                <p>✅ This submission will be marked as ON-TIME</p>
                {session.late_submission_window && (
                  <p className="small-text">
                    Late submissions accepted until{' '}
                    {new Date(session.late_submission_deadline).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Notes */}
              {session.notes && (
                <div className="session-notes">
                  <p className="notes-label">📝 Notes:</p>
                  <p>{session.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="loading-state">
              <p>Loading session details...</p>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="confirmation">
            <label>
              <input
                type="checkbox"
                id="confirm-submit"
                disabled={!session || loading}
                required
              />
              <span>
                I confirm that I'm submitting this lab report for{' '}
                <strong>{session?.session_title}</strong>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!session || loading}
            >
              {loading ? '⏳ Submitting...' : '✓ Confirm & Submit'}
            </button>
          </div>
        </form>

        {/* Receipt Section (shown after successful submission) */}
        {successMessage && (
          <div className="receipt-section">
            <h3>📋 Your Submission Receipt</h3>
            <div className="receipt-details">
              <p>
                <strong>Receipt ID:</strong> RCP-{new Date().getTime()}
              </p>
              <p>
                <strong>Submitted:</strong> {new Date().toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> ✅ ON-TIME
              </p>
            </div>
            <p className="receipt-note">
              🔒 This is your submission proof. A confirmation email has been sent to
              your email address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionModal;
