const express = require('express');
const router = express.Router();

const QUESTION_TEMPLATES = {
  communication: [
    "When we disagree, I prefer to:",
    "I feel most heard when you:",
    "During conflicts, I tend to:",
    "I prefer to receive feedback:",
    "When making decisions together, I:"
  ],
  intimacy: [
    "I feel most emotionally connected when we:",
    "Physical affection is most meaningful to me when:",
    "I feel most comfortable being vulnerable when:",
    "Our relationship feels strongest when we:",
    "I show love best through:"
  ],
  fun: [
    "For our ideal date night, I'd choose:",
    "When we have free time, I prefer:",
    "I'm most excited about activities that are:",
    "My favorite way to spend weekends together is:",
    "I feel most energized when we:"
  ],
  love: [
    "I feel most loved when you:",
    "My primary love language is:",
    "I prefer to show affection through:",
    "What makes me feel most appreciated is:",
    "I feel most secure in our relationship when:"
  ],
  future: [
    "In 5 years, I see us:",
    "My biggest relationship goal is:",
    "I'm most excited about our future when I think about:",
    "For our relationship to grow, we should focus on:",
    "My dream for us includes:"
  ]
};

router.post('/adaptive', (req, res) => {
  const category = req.body.category || 'communication';
  const count = Math.min(req.body.count || 5, 10);
  const templates = QUESTION_TEMPLATES[category] || QUESTION_TEMPLATES.communication;

  res.json({
    questions: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      text: templates[i % templates.length],
      category,
      type: 'multiple_choice'
    })),
    learning_based: true
  });
});

router.post('/generate', (req, res) => {
  const category = req.body.category || 'general';
  const count = Math.min(req.body.count || 5, 10);
  const templates = QUESTION_TEMPLATES[category] || QUESTION_TEMPLATES.communication;

  res.json({
    questions: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      text: templates[i % templates.length],
      category,
      type: 'open_ended'
    })),
    generated_at: new Date().toISOString(),
    learning_based: true
  });
});

module.exports = router;
