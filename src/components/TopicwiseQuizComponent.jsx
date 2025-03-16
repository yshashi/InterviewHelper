import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function TopicwiseQuizComponent({ topicKey, topicName }) {
  // Use useRef to track if component is mounted to prevent hydration issues
  const isMounted = useRef(false);
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [attemptCount, setAttemptCount] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [mcqId, setMcqId] = useState(null);

  const API_URL = import.meta.env.PROD 
    ? 'https://api.interviewhelper.in/api' 
    : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');
  
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
  
  const fetchQuestions = useCallback(async () => {
    if (!topicKey || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/topicwise-mcq/${topicKey}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (isMounted.current) {
        setQuestions(data.questions || []);
        if (data.id) {
          setMcqId(data.id);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [topicKey]);

  useEffect(() => {
    if (isClient && topicKey && !quizStarted) {
      fetchQuestions();
    }
  }, [isClient, topicKey, quizStarted, fetchQuestions]);

  useEffect(() => {
    if (!isClient) return;
    
    let timer;
    if (quizStarted && !showResults && timeLeft > 0) {
      timer = setTimeout(() => {
        if (isMounted.current) {
          setTimeLeft(prev => prev - 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && !showResults && currentQuestionIndex < questions.length - 1) {
      handleNextQuestion();
    } else if (timeLeft === 0 && currentQuestionIndex === questions.length - 1 && isMounted.current) {
      setShowResults(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isClient, timeLeft, quizStarted, showResults, currentQuestionIndex, questions.length]);

  const startQuiz = useCallback(() => {
    setQuizStarted(true);
    setTimeLeft(60);
    setStartTime(Date.now());
  }, []);

  const handleOptionSelect = useCallback((option) => {
    setSelectedOption(option);
  }, []);
  
  const saveQuizResults = useCallback(async (resultsData) => {
    if (!isAuthenticated || !mcqId) return false;
    
    try {
      const token = localStorage.getItem('interviewhelper:accessToken');
      if (!token) return false;
      
      const correctAnswers = resultsData.answers ? resultsData.answers.filter(a => a.isCorrect).length : resultsData.score;
      const totalQuestions = resultsData.totalQuestions || (resultsData.answers ? resultsData.answers.length : questions.length);
      const wrongAnswers = totalQuestions - correctAnswers;

      const questionDetails = resultsData.answers ? resultsData.answers.map((answer, index) => ({
        questionId: index + 1,
        question: answer.question,
        selectedOption: answer.selectedOption,
        correctOption: answer.correctOption,
        isCorrect: answer.isCorrect,
        timeTaken: Math.floor(resultsData.totalTimeTaken / resultsData.answers.length) // Approximate time per question
      })) : [];

      const topicwisePayload = {
        topicwiseMcqId: mcqId,
        totalTimeTaken: resultsData.totalTimeTaken,
        correctAnswerCount: correctAnswers,
        wrongAnswerCount: wrongAnswers,
        attemptCount: resultsData.attemptCount,
        questionDetails: questionDetails
      };
      
      const response = await fetch(`${API_URL}/topicwise-quiz-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(topicwisePayload)
      });
      
      if (response.ok) {
        localStorage.removeItem('interviewhelper:pendingQuizResults');
        return true;
      } else {
        const regularPayload = {
          mcqId: mcqId,
          totalTimeTaken: resultsData.totalTimeTaken,
          correctAnswerCount: correctAnswers,
          wrongAnswerCount: wrongAnswers,
          attemptCount: resultsData.attemptCount
        };
        
        const fallbackResponse = await fetch(`${API_URL}/quiz-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(regularPayload)
        });
        
        if (fallbackResponse.ok) {
          localStorage.removeItem('interviewhelper:pendingQuizResults');
          return true;
        } else {
          throw new Error(`Failed to save quiz results: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Error saving quiz results:', err);
      return false;
    }
  }, [isAuthenticated, mcqId, questions.length]);

  const handleNextQuestion = useCallback(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return;
    
    // Record the answer
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    setAnswers(prev => [...prev, {
      question: currentQuestion.question,
      selectedOption,
      correctOption: currentQuestion.correct_answer,
      isCorrect
    }]);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTimeLeft(60);
    } else {
      let finalTimeTaken = totalTimeTaken;
      if (startTime) {
        const endTime = Date.now();
        finalTimeTaken = Math.floor((endTime - startTime) / 1000);
        setTotalTimeTaken(finalTimeTaken);
      }
      
      // Include the last answer in the answers array
      const finalAnswers = [...answers, {
        question: currentQuestion.question,
        selectedOption,
        correctOption: currentQuestion.correct_answer,
        isCorrect
      }];
      
      const finalScore = finalAnswers.filter(answer => answer.isCorrect).length;
      
      const finalQuizData = {
        score: finalScore,
        totalQuestions: questions.length,
        answers: finalAnswers,
        totalTimeTaken: finalTimeTaken,
        attemptCount: attemptCount
      };
      
      setQuizData(finalQuizData);
      setQuizCompleted(true);
      
      if (isAuthenticated) {
        setShowResults(true);
        saveQuizResults(finalQuizData);
      } else {
        setShowLoginPrompt(true);
      }
    }
  }, [questions, currentQuestionIndex, selectedOption, answers, totalTimeTaken, startTime, attemptCount, isAuthenticated, saveQuizResults]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResults(false);
    setTimeLeft(60);
    setAnswers([]);
    setQuizStarted(false);
    setStartTime(null);
    setTotalTimeTaken(0);
    setAttemptCount(prevCount => prevCount + 1);
    setQuizCompleted(false);
    setShowLoginPrompt(false);
    setQuizData(null);
  }, []);
  
  const handleLogin = useCallback(() => {
    if (quizData && mcqId) {
      const questionDetails = quizData.answers ? quizData.answers.map((answer, index) => ({
        questionId: index + 1,
        question: answer.question,
        selectedOption: answer.selectedOption,
        correctOption: answer.correctOption,
        isCorrect: answer.isCorrect,
        timeTaken: Math.floor(quizData.totalTimeTaken / quizData.answers.length) // Approximate time per question
      })) : [];
      
      localStorage.setItem('interviewhelper:pendingQuizResults', JSON.stringify({
        topicKey,
        topicName,
        mcqId,
        isTopicwiseQuiz: true,
        questionDetails,
        ...quizData
      }));
    }
    
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  }, [quizData, mcqId, topicKey, topicName]);
  
  useEffect(() => {
    if (isAuthenticated && isClient) {
      const pendingResults = localStorage.getItem('interviewhelper:pendingQuizResults');
      if (pendingResults) {
        try {
          const parsedResults = JSON.parse(pendingResults);
          if (parsedResults.topicKey === topicKey) {
            setScore(parsedResults.score || 0);
            setAnswers(parsedResults.answers || []);
            setTotalTimeTaken(parsedResults.totalTimeTaken || 0);
            setAttemptCount(parsedResults.attemptCount || 1);
            setShowResults(true);
            setQuizStarted(true);
            setQuizCompleted(true);
            
            if (parsedResults.mcqId) {
              setMcqId(parsedResults.mcqId);
            }
            
            const answers = parsedResults.answers || [];
            const finalScore = answers.filter(answer => answer.isCorrect).length;
            const restoredQuizData = {
              score: finalScore,
              totalQuestions: parsedResults.totalQuestions || answers.length,
              answers: answers,
              totalTimeTaken: parsedResults.totalTimeTaken || 0,
              attemptCount: parsedResults.attemptCount || 1,
              questionDetails: parsedResults.questionDetails || []
            };
            
            setTimeout(async () => {
              const success = await saveQuizResults(restoredQuizData);
              if (success) {
                localStorage.removeItem('interviewhelper:pendingQuizResults');
              }
            }, 0);
          }
        } catch (e) {
          console.error('Error parsing pending quiz results', e);
          localStorage.removeItem('interviewhelper:pendingQuizResults');
        }
      }
    }
  }, [isAuthenticated, isClient, topicKey, saveQuizResults]);

  if (!isClient) {
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Loading quiz...
        </p>
      </div>
    );
  }
  
  if (!quizStarted) {
    if (loading) {
      return (
        <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Loading questions...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-angular-primary"></div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
          <p className="mb-6 text-red-600 dark:text-red-400">
            Error loading questions: {error}
          </p>
          <button
            onClick={fetchQuestions}
            className="px-6 py-2 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    if (!questions || questions.length === 0) {
      return (
        <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Quiz content for this topic is currently being developed. Check back soon!
          </p>
        </div>
      );
    }
    
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Test your knowledge with {questions.length} questions. You'll have 60 seconds to answer each question.
        </p>
        <button
          onClick={startQuiz}
          className="px-6 py-2 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (showLoginPrompt && quizCompleted) {
    return (
      <div className="my-2 sm:my-4 lg:my-8 p-3 sm:p-4 lg:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 max-w-[95%] mx-auto">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-800 dark:text-white">Quiz Completed!</h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
            Great job completing the quiz! To view your results, please log in or create an account. 
            This will allow you to track your progress and compare your performance over time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLogin}
              className="w-full sm:w-auto min-h-[2.5rem] sm:min-h-[2.75rem] px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Log In / Sign Up
            </button>
            
            <button
              onClick={resetQuiz}
              className="w-full sm:w-auto min-h-[2.5rem] sm:min-h-[2.75rem] px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (showResults && questions.length > 0) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Results</h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Your Score</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{score} / {questions.length} ({percentage}%)</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Time taken: {Math.floor(totalTimeTaken / 60)}m {totalTimeTaken % 60}s
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetQuiz}
                className="px-6 py-2 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Question Review</h3>
          
          {answers.map((answer, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                answer.isCorrect 
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
              }`}
            >
              <p className="font-medium text-gray-800 dark:text-white mb-2">
                {index + 1}. {answer.question}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const isSelected = answer.selectedOption === option;
                  const isCorrect = answer.correctOption === option;
                  
                  let optionClass = 'p-2 rounded border ';
                  
                  if (isSelected && isCorrect) {
                    optionClass += 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
                  } else if (isSelected && !isCorrect) {
                    optionClass += 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700';
                  } else if (isCorrect) {
                    optionClass += 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
                  } else {
                    optionClass += 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
                  }
                  
                  return (
                    <div key={option} className={optionClass}>
                      <div className="flex items-start">
                        <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">{option}:</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {questions[index]?.options?.[option] || ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className={`text-sm ${answer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {answer.isCorrect 
                  ? 'Correct!' 
                  : `Incorrect. The correct answer is ${answer.correctOption}.`
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Quiz in progress
  if (questions.length > 0 && currentQuestionIndex < questions.length) {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-16 h-16 flex items-center justify-center rounded-full border-4 ${
              timeLeft > 20 
                ? 'border-green-500 text-green-600 dark:text-green-400' 
                : timeLeft > 10 
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' 
                  : 'border-red-500 text-red-600 dark:text-red-400'
            }`}>
              <span className="text-xl font-bold">{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedOption === option
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">{option}:</span>
                  <span className="text-gray-700 dark:text-gray-300">{currentQuestion.options[option]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
            className={`px-6 py-2 rounded-lg transition-colors ${
              selectedOption === null
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            } focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="my-4 sm:my-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Loading quiz content...
      </p>
    </div>
  );
}
