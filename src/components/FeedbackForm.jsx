import React, { useState, useCallback, useRef } from 'react';
import { API_URL } from '../config';

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white/50 dark:bg-angular-dark/50 flex items-center justify-center rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-angular-primary"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <div className="flex items-center gap-2 text-red-700 dark:text-red-200">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p>{message}</p>
    </div>
  </div>
);

const SuccessMessage = () => (
  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
    <div className="flex items-center gap-2 text-green-700 dark:text-green-200">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p>Thank you for your feedback! We appreciate your input.</p>
    </div>
  </div>
);

const FeedbackForm = ({ topic }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount
  React.useEffect(() => {
    setIsClient(true);
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const submitFeedback = useCallback(async (feedbackData) => {
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('interviewhelper:accessToken')}`
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      return data;
    } catch (err) {
      throw new Error(err.message || 'Failed to submit feedback');
    }
  }, []);

  const handleYesClick = useCallback(async () => {
    if (!topic?.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await submitFeedback({
        topic: topic.trim(),
        type: 'HELPFUL'
      });

      if (isMounted.current) {
        setIsSubmitted(true);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [topic]);

  const handleNoClick = useCallback(() => {
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.classList.remove('hidden');
      feedbackForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSubmitFeedback = useCallback(async (event) => {
    event.preventDefault();
    if (!topic?.trim()) return;

    const comment = event.target.elements.feedback.value?.trim();
    if (!comment) {
      setError('Please provide feedback on how we can improve');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await submitFeedback({
        topic: topic.trim(),
        type: 'NEEDS_IMPROVEMENT',
        comment
      });

      if (isMounted.current) {
        setIsSubmitted(true);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [topic, submitFeedback]);

  if (!isClient) {
    return null; // Prevent SSR issues
  }

  if (isSubmitted) {
    return <SuccessMessage />;
  }

  return (
    <div className="relative mt-8 sm:mt-12 p-4 sm:p-6 bg-gray-50 dark:bg-angular-dark-lighter rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Was this helpful?</h2>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <button
          className={`px-4 sm:px-6 py-2 text-sm sm:text-base text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-t transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-angular-dark ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleYesClick}
          disabled={isLoading}
        >
          Yes, this helped!
        </button>
        <button
          className={`px-4 sm:px-6 py-2 text-sm sm:text-base text-white rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:bg-gradient-to-t transition-colors focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 dark:focus:ring-offset-angular-dark ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleNoClick}
          disabled={isLoading}
        >
          No, I need more info
        </button>
      </div>
      
      <div className="mt-4 sm:mt-6 hidden" id="feedback-form">
        <form onSubmit={handleSubmitFeedback}>
          <textarea
            name="feedback"
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white dark:bg-angular-dark-lighter dark:border-gray-600 dark:text-angular-text-dark focus:ring-2 focus:ring-angular-tertiary focus:border-transparent text-sm sm:text-base"
            rows="4"
            placeholder="How can we improve this answer? Your feedback helps us make better content."
            required
          />
          <button
            type="submit"
            className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 text-sm sm:text-base text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-t transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-angular-dark ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            Submit Feedback
          </button>
        </form>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default FeedbackForm;
