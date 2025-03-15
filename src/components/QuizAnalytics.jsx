import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function QuizAnalytics({ userId = null }) {
  // Client-side state management with safe state updates
  const isMounted = useRef(false);
  const [isClient, setIsClient] = useState(false);
  
  // Memoized state update functions to prevent stale closures
  const safeSetState = useCallback((setter) => {
    return (value) => {
      if (isMounted.current) {
        setter(value);
      }
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const safeSetLoading = useCallback(safeSetState(setLoading), [safeSetState]);
  const safeSetError = useCallback(safeSetState(setError), [safeSetState]);
  const safeSetIsAuthenticated = useCallback(safeSetState(setIsAuthenticated), [safeSetState]);
  
  const [topicPerformance, setTopicPerformance] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  
  const safeSetTopicPerformance = useCallback(safeSetState(setTopicPerformance), [safeSetState]);
  const safeSetProgressData = useCallback(safeSetState(setProgressData), [safeSetState]);
  const safeSetWeakAreas = useCallback(safeSetState(setWeakAreas), [safeSetState]);
  
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');
  const [comparisonMode, setComparisonMode] = useState(false);
  
  const [strengthsAndWeaknesses, setStrengthsAndWeaknesses] = useState({
    strengths: [],
    weaknesses: [],
    recommendations: []
  });
  
  const safeSetStrengthsAndWeaknesses = useCallback(safeSetState(setStrengthsAndWeaknesses), [safeSetState]);

  const API_URL = import.meta.env.PROD 
    ? 'https://api.interviewhelper.in/api' 
    : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('interviewhelper:accessToken');
    const user = localStorage.getItem('interviewhelper:user');
    return token && user ? token : null;
  }, []);

  useEffect(() => {
    let isComponentMounted = true;

    const initializeComponent = async () => {
      try {
        if (!isMounted.current) {
          isMounted.current = true;
          if (isComponentMounted) {
            setIsClient(true);
          }

          const token = localStorage.getItem('interviewhelper:accessToken');
          const user = localStorage.getItem('interviewhelper:user');
          
          if (isComponentMounted) {
            if (token && user) {
              safeSetIsAuthenticated(true);
            } else {
              safeSetIsAuthenticated(false);
              safeSetError('Please log in to view analytics');
            }
          }
        }
      } catch (err) {
        console.error('Error initializing component:', err);
        if (isComponentMounted) {
          safeSetError('Failed to initialize analytics component');
        }
      }
    };

    initializeComponent();
    
    return () => {
      isComponentMounted = false;
      isMounted.current = false;
    };
  }, [safeSetIsAuthenticated, safeSetError]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!isMounted.current) return;

    safeSetLoading(true);
    safeSetError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        safeSetIsAuthenticated(false);
        safeSetError('Authentication required');
        safeSetLoading(false);
        return;
      }

      const makeApiRequest = async (endpoint, params = '') => {
        const response = await fetch(`${API_URL}${endpoint}${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      };

      const [topicData, progressData, weakAreasData] = await Promise.all([
        makeApiRequest('/topicwise-quiz-results/analytics/topic-performance'),
        makeApiRequest('/topicwise-quiz-results/analytics/progress', 
          selectedTopic !== 'all' ? `?topicKey=${selectedTopic}` : ''
        ),
        makeApiRequest('/topicwise-quiz-results/analytics/weak-areas')
      ]);

      if (isMounted.current) {
        safeSetTopicPerformance(topicData);
        safeSetProgressData(progressData);
        safeSetWeakAreas(weakAreasData);
        safeSetLoading(false);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      if (isMounted.current) {
        safeSetError(err.message);
        safeSetLoading(false);
      }
    }
  }, [
    API_URL,
    selectedTopic,
    getAuthToken,
    safeSetLoading,
    safeSetError,
    safeSetIsAuthenticated,
    safeSetTopicPerformance,
    safeSetProgressData,
    safeSetWeakAreas
  ]);
  
  useEffect(() => {
    if (isClient && isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [isClient, isAuthenticated, fetchAnalyticsData]);

  const handleTopicChange = useCallback((e) => {
    try {
      const newTopic = e?.target?.value;
      if (!newTopic) {
        console.warn('Invalid topic value received');
        return;
      }
      setSelectedTopic(newTopic);
    } catch (err) {
      console.error('Error handling topic change:', err);
      safeSetError('Failed to update selected topic');
    }
  }, [safeSetError]);
  
  const handleTabChange = useCallback((tab) => {
    try {
      if (!tab || typeof tab !== 'string') {
        console.warn('Invalid tab value received');
        return;
      }
      setActiveTab(tab);
    } catch (err) {
      console.error('Error handling tab change:', err);
      safeSetError('Failed to update active tab');
    }
  }, [safeSetError]);

  const handleTimeRangeChange = useCallback((range) => {
    try {
      if (!range || typeof range !== 'string') {
        console.warn('Invalid time range value received');
        return;
      }
      setTimeRange(range);
    } catch (err) {
      console.error('Error handling time range change:', err);
      safeSetError('Failed to update time range');
    }
  }, [safeSetError]);

  const toggleComparisonMode = useCallback(() => {
    try {
      setComparisonMode(prev => !prev);
    } catch (err) {
      console.error('Error toggling comparison mode:', err);
      safeSetError('Failed to toggle comparison mode');
    }
  }, [safeSetError]);

  const calculateStrengthsAndWeaknesses = useCallback(() => {
    try {
      if (!Array.isArray(topicPerformance) || !topicPerformance.length) {
        console.warn('No topic performance data available');
        return;
      }

      const validTopics = topicPerformance.filter(topic => {
        return topic && 
               typeof topic === 'object' && 
               'topic' in topic && 
               'averageScore' in topic && 
               typeof topic.averageScore === 'number';
      });

      if (validTopics.length === 0) {
        console.warn('No valid topic performance data found');
        return;
      }

      const strengths = validTopics
        .filter(topic => topic.averageScore >= 80)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 3);

      const weaknesses = validTopics
        .filter(topic => topic.averageScore < 60)
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 3);

      const recommendations = weaknesses.map(topic => ({
        topic: topic.topic,
        recommendation: `Focus on improving your understanding of ${topic.topic}. Consider reviewing the material and taking practice quizzes.`
      }));

      safeSetStrengthsAndWeaknesses({
        strengths,
        weaknesses,
        recommendations
      });
    } catch (err) {
      console.error('Error calculating strengths and weaknesses:', err);
      safeSetError('Failed to analyze performance data');
    }
  }, [topicPerformance]);

  useEffect(() => {
    if (isClient && isAuthenticated) {
      calculateStrengthsAndWeaknesses();
    }
  }, [isClient, isAuthenticated, calculateStrengthsAndWeaknesses]);

  const calculateMovingAverage = useCallback((data, window) => {
    try {
      if (!Array.isArray(data) || data.length === 0) return [];
      return data.map((_, index) => {
        const start = Math.max(0, index - window + 1);
        const values = data.slice(start, index + 1);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    } catch (err) {
      console.error('Error calculating moving average:', err);
      return [];
    }
  }, []);

  const prepareTopicPerformanceChartData = useCallback(() => {
    try {
      if (!Array.isArray(topicPerformance) || topicPerformance.length === 0) {
        return {
          labels: [],
          datasets: [{ data: [] }]
        };
      }

      return {
        labels: topicPerformance.map(topic => topic?.topic || 'Unknown'),
        datasets: [
          {
            label: 'Average Score (%)',
            data: topicPerformance.map(topic => topic?.averageScore || 0),
            backgroundColor: topicPerformance.map(topic => {
              const score = topic?.averageScore || 0;
              return score >= 80 ? 'rgba(75, 192, 192, 0.5)' :
                     score >= 60 ? 'rgba(255, 205, 86, 0.5)' :
                     'rgba(255, 99, 132, 0.5)';
            }),
            borderColor: topicPerformance.map(topic => {
              const score = topic?.averageScore || 0;
              return score >= 80 ? 'rgba(75, 192, 192, 1)' :
                     score >= 60 ? 'rgba(255, 205, 86, 1)' :
                     'rgba(255, 99, 132, 1)';
            }),
            borderWidth: 1,
            yAxisID: 'y'
          },
          ...(comparisonMode ? [{
            label: 'Number of Attempts',
            data: topicPerformance.map(topic => topic?.totalAttempts || 0),
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            yAxisID: 'attempts'
          }] : [])
        ]
      };
    } catch (err) {
      console.error('Error preparing topic performance chart data:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [topicPerformance, comparisonMode]);

  const prepareProgressChartData = useCallback(() => {
    try {
      if (!Array.isArray(progressData) || progressData.length === 0) {
        return {
          labels: [],
          datasets: [{ data: [] }]
        };
      }

      const validData = progressData.filter(entry => 
        entry && typeof entry === 'object' && 
        'date' in entry && 'score' in entry &&
        typeof entry.score === 'number'
      );

      const labels = validData.map(entry => {
        try {
          return new Date(entry.date).toLocaleDateString();
        } catch {
          return 'Invalid Date';
        }
      });

      const scores = validData.map(entry => entry.score);
      const movingAverage = calculateMovingAverage(scores, 5);

      return {
        labels,
        datasets: [
          {
            label: 'Score (%)',
            data: scores,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: scores.map(score =>
              score >= 80 ? 'rgba(75, 192, 192, 1)' :
              score >= 60 ? 'rgba(255, 205, 86, 1)' :
              'rgba(255, 99, 132, 1)'
            )
          },
          {
            label: 'Moving Average',
            data: movingAverage,
            borderColor: 'rgba(255, 159, 64, 1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      };
    } catch (err) {
      console.error('Error preparing progress chart data:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [progressData, calculateMovingAverage]);

  const prepareWeakAreasChartData = useCallback(() => {
    try {
      if (!Array.isArray(weakAreas) || weakAreas.length === 0) {
        return {
          labels: ['No Data'],
          datasets: [{ data: [1], backgroundColor: ['#e5e7eb'] }]
        };
      }

      const validAreas = weakAreas
        .filter(area => 
          area && typeof area === 'object' &&
          'topic' in area && 'successRate' in area &&
          typeof area.successRate === 'number'
        )
        .slice(0, 5)
        .sort((a, b) => a.successRate - b.successRate); // Sort by lowest success rate

      const labels = validAreas.map(area => {
        const topic = area.topic || 'Unknown Topic';
        return `${topic} (${area.successRate.toFixed(1)}%)`;
      });

      const improvementNeeded = validAreas.map(area => 100 - area.successRate);

      return {
        labels,
        datasets: [
          {
            data: improvementNeeded,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(54, 162, 235, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 4
          }
        ]
      };
    } catch (err) {
      console.error('Error preparing weak areas chart data:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [weakAreas]);

  const topicPerformanceChartData = useMemo(() => {
    try {
      return prepareTopicPerformanceChartData() || { labels: [], datasets: [{ data: [] }] };
    } catch (err) {
      console.error('Error in topic performance chart memoization:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [prepareTopicPerformanceChartData]);

  const progressChartData = useMemo(() => {
    try {
      return prepareProgressChartData() || { labels: [], datasets: [{ data: [] }] };
    } catch (err) {
      console.error('Error in progress chart memoization:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [prepareProgressChartData]);

  const weakAreasChartData = useMemo(() => {
    try {
      return prepareWeakAreasChartData() || { labels: [], datasets: [{ data: [] }] };
    } catch (err) {
      console.error('Error in weak areas chart memoization:', err);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [prepareWeakAreasChartData]);

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Analytics</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Please log in to view your quiz analytics.
        </p>
        <a 
          href="/login" 
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Analytics</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Analytics</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={fetchAnalyticsData} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Analytics</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Please log in to view your quiz analytics.
        </p>
        <a 
          href="/login" 
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }
  
  if (topicPerformance.length === 0) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Analytics</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          You haven't taken any quizzes yet. Complete some quizzes to see your analytics!
        </p>
        <a 
          href="/quizzes" 
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Take a Quiz
        </a>
      </div>
    );
  }
  
  return (
    <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quiz Analytics</h2>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="all">All Time</option>
            <option value="month">Last Month</option>
            <option value="week">Last Week</option>
          </select>
          <button
            onClick={toggleComparisonMode}
            className={`px-3 py-1 rounded-md transition-colors ${
              comparisonMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Compare Metrics
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => handleTabChange('overview')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => handleTabChange('progress')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'progress'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Progress
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => handleTabChange('weakAreas')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'weakAreas'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Weak Areas
            </button>
          </li>
        </ul>
      </div>
      
      {/* Topic Filter */}
      <div className="mb-6">
        <label htmlFor="topic-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Topic:
        </label>
        <select
          id="topic-select"
          value={selectedTopic}
          onChange={handleTopicChange}
          className="block w-full px-3 text-gray-700 dark:text-gray-300 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Topics</option>
          {topicPerformance.map(topic => (
            <option key={topic.topic} value={topic.topic}>
              {topic.topic}
            </option>
          ))}
        </select>
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {topicPerformance.map(topic => (
                <div 
                  key={topic.topic}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow"
                >
                  <h4 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">{topic.topic}</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Average Score:</span> {topic.averageScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Best Score:</span> {topic.bestScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Total Attempts:</span> {topic.totalAttempts}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Average Time:</span> {topic.averageTimeTaken.toFixed(1)} seconds
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Progress Over Time</h3>
            {progressData.length > 0 ? (
              <div className="h-80 mb-8">
                <Line 
                  data={progressChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score (%)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                No progress data available for the selected topic.
              </p>
            )}
            
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Quiz Attempts</h3>
            {progressData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Topic
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {progressData.slice(0, 10).map((entry, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {entry.topic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {entry.score.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {entry.timeTaken} seconds
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                No recent quiz attempts for the selected topic.
              </p>
            )}
          </div>
        )}
        
        {/* Weak Areas Tab */}
        {activeTab === 'weakAreas' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Areas for Improvement</h3>
            {weakAreas.length > 0 ? (
              <div>
                <div className="h-80 mb-8">
                  <Pie 
                    data={weakAreasChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Areas Needing Most Improvement',
                          color: 'rgb(156, 163, 175)',
                          font: {
                            size: 16,
                            weight: 'bold'
                          },
                          padding: { bottom: 20 }
                        },
                        legend: {
                          position: 'right',
                          align: 'center',
                          labels: {
                            color: 'rgb(156, 163, 175)',
                            font: { size: 12 },
                            padding: 20,
                            usePointStyle: true,
                            generateLabels: function(chart) {
                              const data = chart.data;
                              if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => ({
                                  text: label,
                                  fillStyle: data.datasets[0].backgroundColor[i],
                                  strokeStyle: data.datasets[0].borderColor[i],
                                  lineWidth: 1,
                                  hidden: false,
                                  index: i
                                }));
                              }
                              return [];
                            }
                          }
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'rgb(255, 255, 255)',
                          bodyColor: 'rgb(255, 255, 255)',
                          padding: 12,
                          callbacks: {
                            label: function(context) {
                              return `Improvement needed: ${context.raw.toFixed(1)}%`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Weak Areas Details</h3>
                <div className="space-y-4">
                  {weakAreas.slice(0, 5).map((area, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow"
                    >
                      <h4 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">
                        {area.topic} - Question {area.questionId}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {area.question}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                          Success Rate: {area.successRate.toFixed(1)}%
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Attempts: {area.attempts}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          Avg Time: {area.averageTimeTaken.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                No weak areas identified yet. Take more quizzes to get personalized improvement suggestions.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <a 
          href="/quizzes" 
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Take More Quizzes
        </a>
      </div>
    </div>
  );
}
