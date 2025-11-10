require('dotenv').config();
const { sequelize } = require('./src/utils/database');
const Question = require('./src/models/Question');

const questions = [
  { text: "What's one thing I did this week that made you feel loved?", type: 'open_ended', category: 'relationship' },
  { text: "What's your favorite thing about our relationship right now?", type: 'open_ended', category: 'relationship' },
  { text: "What's one relationship goal we should work on together this month?", type: 'open_ended', category: 'relationship' },
  { text: "How can I better support you when you're stressed?", type: 'open_ended', category: 'relationship' },
  { text: "What's a new date idea you'd love for us to try?", type: 'open_ended', category: 'fun' },
  { text: "What's your favorite way for us to spend quality time together?", type: 'open_ended', category: 'relationship' },
  { text: "What's something you appreciate about how we communicate?", type: 'open_ended', category: 'relationship' },
  { text: "What's one tradition you'd like us to start as a couple?", type: 'open_ended', category: 'relationship' },
  { text: "How do you feel most cherished by me?", type: 'open_ended', category: 'relationship' },
  { text: "What's your favorite memory from our relationship so far?", type: 'open_ended', category: 'memories' }
];

async function seedQuestions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    // Check if questions already exist
    const existingCount = await Question.count();
    if (existingCount > 0) {
      console.log(`${existingCount} questions already exist`);
      return;
    }
    
    await Question.bulkCreate(questions);
    console.log(`${questions.length} questions seeded successfully`);
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedQuestions();