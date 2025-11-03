import { getDb } from '../lib/mongodb'
import { Question } from '../lib/models'

const questions: Omit<Question, '_id'>[] = [
  // Daily questions
  { text: 'What\'s a small, non-physical thing I did recently that made you feel loved?', category: 'love', depth: 'light', module: 'daily', isActive: true },
  { text: 'What\'s one thing you appreciate about our relationship?', category: 'love', depth: 'deep', module: 'daily', isActive: true },
  { text: 'What\'s a memory from our early days that still makes you smile?', category: 'memories', depth: 'light', module: 'daily', isActive: true },
  { text: 'What\'s a skill or hobby you\'d love for us to learn together?', category: 'desires', depth: 'light', module: 'daily', isActive: true },
  { text: 'What\'s one goal you\'d like us to achieve together this year?', category: 'future', depth: 'light', module: 'daily', isActive: true },
  { text: 'If you could have any superpower for a day, what would it be?', category: 'fun', depth: 'light', module: 'daily', isActive: true },

  // Love category - Questions Bank
  { text: 'What\'s your favorite way I show affection?', category: 'love', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What song reminds you of us?', category: 'love', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What does love mean to you in our relationship?', category: 'love', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'How has your understanding of love changed since we\'ve been together?', category: 'love', depth: 'deep', module: 'questions_bank', isActive: true },

  // Memories category
  { text: 'What\'s the funniest thing that\'s happened to us?', category: 'memories', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What was your first impression of me?', category: 'memories', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What moment made you realize you loved me?', category: 'memories', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'What\'s a difficult time we overcame together?', category: 'memories', depth: 'deep', module: 'questions_bank', isActive: true },

  // Desires category
  { text: 'What\'s on your bucket list for us as a couple?', category: 'desires', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What\'s your dream date night?', category: 'desires', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What\'s something you\'ve always wanted but never asked for?', category: 'desires', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'How can I better support your personal goals?', category: 'desires', depth: 'deep', module: 'questions_bank', isActive: true },

  // Dates category
  { text: 'What\'s the best date we\'ve ever been on?', category: 'dates', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'Beach vacation or mountain cabin?', category: 'dates', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What makes a date meaningful to you?', category: 'dates', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'How important is quality time in our relationship?', category: 'dates', depth: 'deep', module: 'questions_bank', isActive: true },

  // Finance category
  { text: 'Are you a saver or a spender?', category: 'finance', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'If we won the lottery, what\'s the first thing we\'d buy?', category: 'finance', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What are your biggest financial fears?', category: 'finance', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'How do you want us to handle money as a couple?', category: 'finance', depth: 'deep', module: 'questions_bank', isActive: true },

  // Family category
  { text: 'What family tradition do you want us to start?', category: 'family', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'Which family member are you most like?', category: 'family', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'How do you want our relationship with both families to evolve?', category: 'family', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'What kind of family do you want us to create together?', category: 'family', depth: 'deep', module: 'questions_bank', isActive: true },

  // Future category
  { text: 'Where do you see us in 5 years?', category: 'future', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What\'s your dream vacation for us?', category: 'future', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'What legacy do you want us to leave together?', category: 'future', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'What\'s your biggest hope for our relationship?', category: 'future', depth: 'deep', module: 'questions_bank', isActive: true },

  // Fun category
  { text: 'What\'s the silliest thing we\'ve done together?', category: 'fun', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'If we were in a movie together, what genre would it be?', category: 'fun', depth: 'light', module: 'questions_bank', isActive: true },
  { text: 'How important is humor in our relationship?', category: 'fun', depth: 'deep', module: 'questions_bank', isActive: true },
  { text: 'How can we keep the playfulness alive in our relationship?', category: 'fun', depth: 'deep', module: 'questions_bank', isActive: true },

  // Occasion-based questions
  { text: 'What\'s your favorite Christmas memory with me?', category: 'memories', depth: 'light', module: 'daily', occasion: 'christmas', isActive: true },
  { text: 'What Christmas tradition would you like us to start this year?', category: 'family', depth: 'light', module: 'daily', occasion: 'christmas', isActive: true },
  { text: 'What\'s the most romantic thing we\'ve done together?', category: 'love', depth: 'light', module: 'daily', occasion: 'valentine', isActive: true },
  { text: 'How would you describe our love story to someone?', category: 'memories', depth: 'deep', module: 'daily', occasion: 'valentine', isActive: true },
  { text: 'What\'s your favorite memory from our first year together?', category: 'memories', depth: 'light', module: 'daily', occasion: 'anniversary', isActive: true },
  { text: 'What are you most excited about for our future together?', category: 'future', depth: 'deep', module: 'daily', occasion: 'anniversary', isActive: true }
]

async function seedDatabase() {
  try {
    const db = await getDb()
    
    // Clear existing questions
    await db.collection('questions').deleteMany({})
    
    // Insert questions
    const result = await db.collection('questions').insertMany(questions)
    console.log(`Inserted ${result.insertedCount} questions`)

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('userProfiles').createIndex({ userId: 1 }, { unique: true })
    await db.collection('couples').createIndex({ connectionCode: 1 }, { unique: true })
    await db.collection('couples').createIndex({ user1Id: 1, user2Id: 1 })
    await db.collection('dailyQuestions').createIndex({ coupleId: 1, date: 1 }, { unique: true })
    await db.collection('responses').createIndex({ userId: 1, coupleId: 1 })
    await db.collection('messages').createIndex({ coupleId: 1, createdAt: -1 })
    await db.collection('questions').createIndex({ category: 1, isActive: 1 })
    await db.collection('questions').createIndex({ occasion: 1 })

    console.log('Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()