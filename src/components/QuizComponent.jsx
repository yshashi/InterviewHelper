import React, { useState, useEffect } from 'react';

export default function QuizComponent({ questions, topicName }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    let timer;
    if (quizStarted && !showResults && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResults && currentQuestionIndex < questions.length - 1) {
      handleNextQuestion();
    } else if (timeLeft === 0 && currentQuestionIndex === questions.length - 1) {
      setShowResults(true);
    }

    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, showResults, currentQuestionIndex, questions.length]);

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeLeft(60);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    // Record the answer
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    setAnswers([...answers, {
      question: currentQuestion.question,
      selectedOption,
      correctOption: currentQuestion.correct_answer,
      isCorrect
    }]);

    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTimeLeft(60); // Reset timer for next question
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResults(false);
    setTimeLeft(60);
    setAnswers([]);
    setQuizStarted(false);
  };

  if (!quizStarted) {
    if (!questions || questions.length === 0) {
      return (
        <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Quiz content for this topic is currently being developed. Check back soon!
          </p>
        </div>
      );
    }
    
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
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

  if (showResults && questions.length > 0) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Results</h2>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Your Score:</span>
            <span className="text-xl font-bold text-angular-primary">{score} / {questions.length}</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full ${
                percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 text-right">{percentage}%</p>
        </div>
        
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Question Summary</h3>
        
        <div className="space-y-4 mb-6">
          {answers.map((answer, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg ${
                answer.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <p className="font-medium text-gray-800 dark:text-white mb-2">
                {index + 1}. {answer.question}
              </p>
              
              <div className="flex flex-col space-y-1 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  Your answer: <span className={answer.isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                    {answer.selectedOption ? questions[index].options[answer.selectedOption] : 'No answer'}
                  </span>
                </p>
                
                {!answer.isCorrect && (
                  <p className="text-gray-700 dark:text-gray-300">
                    Correct answer: <span className="text-green-600 dark:text-green-400 font-medium">
                      {questions[index].options[answer.correctOption]}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={resetQuiz}
          className="px-6 py-3 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
    return (
      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz: {topicName}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Quiz content for this topic is currently being developed. Check back soon!
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        
        <div className="flex items-center">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full border-4 ${
            timeLeft > 30 ? 'border-green-500 text-green-500' : 
            timeLeft > 10 ? 'border-yellow-500 text-yellow-500' : 
            'border-red-500 text-red-500'
          }`}>
            <span className="text-lg font-bold">{timeLeft}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          {currentQuestion.question}
        </h3>
        
        <div className="space-y-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleOptionSelect(key)}
              className={`w-full p-4 text-left rounded-lg transition-colors ${
                selectedOption === key 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span className="font-medium">{key}:</span> {value}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={selectedOption === null}
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedOption === null
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-angular-tertiary focus:ring-offset-2 dark:focus:ring-offset-gray-800'
          }`}
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  );
}
