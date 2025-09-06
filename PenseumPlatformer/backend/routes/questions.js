const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const getQuestionsData = () => {
  try {
    const dataPath = path.join(__dirname, '../data/questions.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading questions data:', error);
    return [];
  }
};

router.get('/', (req, res) => {
  try {
    const questions = getQuestionsData();
    res.json({
      success: true,
      data: questions,
      total: questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
});

router.get('/random/:count?', (req, res) => {
  try {
    const questions = getQuestionsData();
    const count = parseInt(req.params.count) || 10;
    
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, questions.length));
    
    res.json({
      success: true,
      data: selected,
      total: selected.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching random questions',
      error: error.message
    });
  }
});

router.get('/difficulty/:level', (req, res) => {
  try {
    const questions = getQuestionsData();
    const level = req.params.level.toLowerCase();
    
    const filtered = questions.filter(q => 
      q.difficulty && q.difficulty.toLowerCase() === level
    );
    
    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error filtering questions by difficulty',
      error: error.message
    });
  }
});

router.post('/validate', (req, res) => {
  try {
    const { questionIndex, answer } = req.body;
    const questions = getQuestionsData();
    
    if (questionIndex < 0 || questionIndex >= questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
    
    const question = questions[questionIndex];
    const isCorrect = answer === question.correct;
    
    res.json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.correct,
      difficulty: question.difficulty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating answer',
      error: error.message
    });
  }
});

module.exports = router;