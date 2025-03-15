import React, { useState, useEffect, useCallback } from 'react';

export default function TopicwiseQuizList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.PROD 
    ? 'https://api.interviewhelper.in/api' 
    : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');
  
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/topicwise-mcq/keys`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTopics(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);
  
  const formatTopicName = (topic) => {
    if (!topic) return '';
    return topic
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const groupTopicsByFirstLetter = () => {
    const grouped = {};
    
    topics.keys.forEach(topic => {
      const firstLetter = topic.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(topic);
    });
    
    return Object.keys(grouped)
      .sort()
      .map(letter => ({
        letter,
        topics: grouped[letter].sort()
      }));
  };
  
  if (loading) {
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Topic-wise Quizzes</h2>
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Topic-wise Quizzes</h2>
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">Error loading topics: {error}</p>
          <button 
            onClick={fetchTopics}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (topics.length === 0) {
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Topic-wise Quizzes</h2>
        <p className="text-gray-600 dark:text-gray-300">No quiz topics are currently available. Please check back later.</p>
      </div>
    );
  }
  
  const groupedTopics = groupTopicsByFirstLetter();
  
  return (
    <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Topic-wise Quizzes</h2>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Test your knowledge with our interactive quizzes on various technologies and topics.
        Select a topic below to start a quiz.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedTopics.map(group => (
          <div key={group.letter} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
              {group.letter}
            </h3>
            <ul className="space-y-2">
              {group.topics.map(topic => (
                <li key={topic}>
                  <a 
                    href={`/${topic}/quiz`}
                    className="block p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    {formatTopicName(topic)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
