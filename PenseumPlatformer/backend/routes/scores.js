const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const getScoresData = () => {
  try {
    const dataPath = path.join(__dirname, '../data/scores.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveScoresData = (scores) => {
  try {
    const dataPath = path.join(__dirname, '../data/scores.json');
    fs.writeFileSync(dataPath, JSON.stringify(scores, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving scores:', error);
    return false;
  }
};

router.get('/leaderboard/:limit?', (req, res) => {
  try {
    const scores = getScoresData();
    const limit = parseInt(req.params.limit) || 10;
    
    const topScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: topScores,
      total: topScores.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { 
      playerName, 
      score, 
      questionsAnswered, 
      correctAnswers, 
      lives, 
      powerUpsUsed,
      gameMode,
      difficulty 
    } = req.body;
    
    if (!playerName || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Player name and score are required'
      });
    }
    
    const scores = getScoresData();
    const newScore = {
      id: Date.now().toString(),
      playerName,
      score,
      questionsAnswered: questionsAnswered || 0,
      correctAnswers: correctAnswers || 0,
      lives: lives || 0,
      powerUpsUsed: powerUpsUsed || 0,
      gameMode: gameMode || 'standard',
      difficulty: difficulty || 'mixed',
      timestamp: new Date().toISOString(),
      accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered * 100).toFixed(1) : 0
    };
    
    scores.push(newScore);
    
    if (saveScoresData(scores)) {
      res.json({
        success: true,
        message: 'Score saved successfully',
        data: newScore
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error saving score'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing score',
      error: error.message
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const scores = getScoresData();
    const filteredScores = scores.filter(score => score.id !== req.params.id);
    
    if (saveScoresData(filteredScores)) {
      res.json({
        success: true,
        message: 'Score deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error deleting score'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting score',
      error: error.message
    });
  }
});

module.exports = router;