let users = [];  // Define users globally

const loginContainer = document.getElementById('login-container');
const quizContainer = document.getElementById('quiz');
const loginButton = document.getElementById('login-btn');
const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const restartButton = document.getElementById('restart-btn');
const questionContainer = document.getElementById('question-container');
const resultContainer = document.getElementById('result-container');
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const scoreElement = document.getElementById('score-value');
const totalQuestionsElement = document.getElementById('total-questions');
const loginError = document.getElementById('login-error');
const detailsContainer = document.getElementById('details-container');
const detailsList = document.getElementById('details-list');
const viewDetailsButton = document.getElementById('view-details-btn');

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
const questionDetails = [];

// Fetch users from CSV file
async function fetchUsers() {
    try {
        const response = await fetch('users.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const text = await response.text();
        const rows = text.trim().split('\n').slice(1);  // Remove the header row

        users = rows.map(row => {
            const [id, password] = row.split(',');
            return { id: id.trim(), password: password.trim() };  // Trim spaces
        });

        console.log('Fetched Users:', users);  // Debugging statement
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Fetch questions from CSV file
async function fetchQuestions() {
    try {
        const response = await fetch('questions.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const text = await response.text();
        const rows = text.trim().split('\n').slice(1);  // Remove the header row

        shuffledQuestions = rows.map(row => {
            const [question, option1, option2, option3, option4, correctOption] = row.split(',');

            // Check if the data is valid
            if (!question || !option1 || !option2 || !option3 || !option4 || correctOption === undefined) {
                console.error('Invalid row data:', row);
                return null;
            }

            // Parse the correct option index as an integer
            const correctIndex = parseInt(correctOption, 10);
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                console.error('Invalid correctOption index:', correctOption);
                return null;
            }

            return {
                question,
                answers: [
                    { text: option1, correct: correctIndex === 0 },
                    { text: option2, correct: correctIndex === 1 },
                    { text: option3, correct: correctIndex === 2 },
                    { text: option4, correct: correctIndex === 3 },
                ]
            };
        }).filter(q => q !== null)  // Remove any null values caused by invalid rows
        .sort(() => Math.random() - 0.5);  // Shuffle questions

        console.log('Fetched Questions:', shuffledQuestions);  // Debugging statement

        if (shuffledQuestions.length === 0) {
            console.error('No valid questions found');
        } else {
            totalQuestionsElement.textContent = shuffledQuestions.length;
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

// POST results to the server
async function postResultsToServer() {
    const userId = document.getElementById('user-id').value.trim();  // Get User ID from the input
    const results = questionDetails.map(detail => ({
        userId,
        score,
        question: detail.question,
        correct: detail.correct ? 'Correct' : 'Incorrect'
    }));

    try {
        const response = await fetch('https://yourserver.com/save_results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        console.log('Results posted to server:', results);
    } catch (error) {
        console.error('Error posting results:', error);
    }
}

// Login Event Handler
loginButton.addEventListener('click', async () => {
    await fetchUsers();
    handleLogin();
});

// Start Button Event Handler
startButton.addEventListener('click', () => {
    fetchQuestions().then(() => {
        if (shuffledQuestions.length > 0) {
            startQuiz();
        } else {
            alert('No questions available to start the quiz.');
        }
    });
});

// Next Button Event Handler
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    setNextQuestion();
});

// Restart Button Event Handler
restartButton.addEventListener('click', startQuiz);

// View Details Button Event Handler
viewDetailsButton.addEventListener('click', () => {
    detailsContainer.classList.toggle('hide');
});

// Handle Login Function
async function handleLogin() {
    const userId = document.getElementById('user-id').value.trim();  // Trim spaces
    const password = document.getElementById('password').value.trim();  // Trim spaces

    console.log('Attempting to log in with:', { userId, password });  // Debugging statement
    
    const user = users.find(u => u.id === userId && u.password === password);
    console.log('User found:', user);  // Debugging statement
    
    if (user) {
        loginContainer.classList.add('hide');
        quizContainer.classList.remove('hide');
        startButton.classList.remove('hide');
        loginError.classList.add('hide');  // Hide login error on successful login
    } else {
        loginError.classList.remove('hide');
    }
}

// Start Quiz Function
function startQuiz() {
    startButton.classList.add('hide');
    resultContainer.classList.add('hide');
    questionContainer.classList.remove('hide');
    shuffledQuestions = shuffledQuestions.sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    score = 0;
    totalQuestionsElement.textContent = shuffledQuestions.length;
    setNextQuestion();
    questionDetails.length = 0;  // Reset question details
}

// Set Next Question Function
function setNextQuestion() {
    resetState();
    showQuestion(shuffledQuestions[currentQuestionIndex]);
}

// Show Question Function
function showQuestion(question) {
    questionElement.innerText = question.question;
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        button.addEventListener('click', () => selectAnswer(button, answer.correct, question.question));
        answerButtonsElement.appendChild(button);
    });
}

// Reset State Function
function resetState() {
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// Select Answer Function
function selectAnswer(button, correct, questionText) {
    if (correct) {
        button.classList.add('correct');
        score++;
        questionDetails.push({ question: questionText, correct: true });
    } else {
        button.classList.add('wrong');
        questionDetails.push({ question: questionText, correct: false });
    }
    Array.from(answerButtonsElement.children).forEach(btn => {
        btn.disabled = true;
    });
    if (shuffledQuestions.length > currentQuestionIndex + 1) {
        nextButton.classList.remove('hide');
    } else {
        showResult();
    }
}

// Show Result Function
function showResult() {
    questionContainer.classList.add('hide');
    resultContainer.classList.remove('hide');
    scoreElement.textContent = score;
    // Update total questions
    totalQuestionsElement.textContent = shuffledQuestions.length;
    
    // Populate question details
    detailsList.innerHTML = '';
    questionDetails.forEach(detail => {
        const li = document.createElement('li');
        li.textContent = detail.question;
        if (detail.correct) {
            li.classList.add('correct');
            li.innerHTML += ' <i class="fas fa-check-circle"></i> Correct';
        } else {
            li.classList.add('wrong');
            li.innerHTML += ' <i class="fas fa-times-circle"></i> Incorrect';
        }
        detailsList.appendChild(li);
    });

    // Post the results to server
    postResultsToServer();
}
