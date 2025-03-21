import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { API_URL } from '../config';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function QuizDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalQuizzes: 0,
    totalCorrect: 0,
    totalWrong: 0,
    averageScore: 0,
    topPerformingTopics: [],
    recentActivity: []
  });
  const isMounted = useRef(false);

  useEffect(() => {
    setIsClient(true);
    isMounted.current = true;

    const checkAuth = () => {
      const token = localStorage.getItem('interviewhelper:accessToken');
      const user = localStorage.getItem('interviewhelper:user');
      setIsAuthenticated(!!(token && user));
    };
    
    checkAuth();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('interviewhelper:accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/topicwise-quiz-results/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (isMounted.current) {
        setDashboardData(data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (isMounted.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [API_URL, isAuthenticated]);
  
  useEffect(() => {
    if (isClient && isAuthenticated) {
      fetchDashboardData();
    }
  }, [isClient, isAuthenticated, fetchDashboardData]);
  
  const performanceChartData = {
    labels: ['Correct', 'Wrong'],
    datasets: [
      {
        data: [dashboardData.totalCorrect, dashboardData.totalWrong],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const topicsChartData = {
    labels: dashboardData.topPerformingTopics.map(topic => topic.topic),
    datasets: [
      {
        label: 'Average Score (%)',
        data: dashboardData.topPerformingTopics.map(topic => topic.averageScore),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
  
  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Quiz Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Loading dashboard...
        </p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Quiz Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Please log in to view your quiz dashboard.
        </p>
        <a 
          href="/login" 
          className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Quiz Dashboard
        </h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Quiz Dashboard
        </h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (dashboardData.totalQuizzes === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Quiz Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You haven't taken any quizzes yet. Complete some quizzes to see your dashboard!
        </p>
        <a 
          href="/quizzes" 
          className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Take a Quiz
        </a>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
        Quiz Dashboard
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-400 bg-opacity-30 h-10 w-10">
              <i className="fas fa-clipboard-check flex justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Total Quizzes</p>
              <p className="text-2xl font-bold">{dashboardData.totalQuizzes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-400 bg-opacity-30 h-10 w-10">
              <i className="fas fa-check flex justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Correct Answers</p>
              <p className="text-2xl font-bold">{dashboardData.totalCorrect}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-400 bg-opacity-30 h-10 w-10">
              <i className="fas fa-times flex justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Wrong Answers</p>
              <p className="text-2xl font-bold">{dashboardData.totalWrong}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-400 bg-opacity-30 h-10 w-10">
              <i className="fas fa-star flex justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Average Score</p>
              <p className="text-2xl font-bold">{dashboardData.averageScore.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Overall Performance</h4>
          <div className="h-64">
            <Doughnut 
              data={performanceChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Top Performing Topics</h4>
          {dashboardData.topPerformingTopics.length > 0 ? (
            <div className="h-64">
              <Bar 
                data={topicsChartData} 
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
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              No topic data available yet.
            </p>
          )}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Recent Activity</h4>
        {dashboardData.recentActivity.length > 0 ? (
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dashboardData.recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {activity.topic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {activity.score.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        activity.score >= 70
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : activity.score >= 40
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {activity.score >= 70 ? 'Good' : activity.score >= 40 ? 'Average' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            No recent activity available.
          </p>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <a 
          href="/analytics" 
          className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          View Detailed Analytics
        </a>
      </div>
    </div>
  );
}
