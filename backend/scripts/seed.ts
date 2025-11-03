import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultQuestions = [
  // Regular questions
  { text: "What's a small, non-physical thing I did recently that made you feel loved?", category: "love", depth: "light", module: "daily", occasion: null },
  { text: "What's one thing you appreciate about our relationship?", category: "love", depth: "deep", module: "daily", occasion: null },
  { text: "What's a memory from our early days that still makes you smile?", category: "memories", depth: "light", module: "daily", occasion: null },
  { text: "What's a skill or hobby you'd love for us to learn together?", category: "desires", depth: "light", module: "daily", occasion: null },
  { text: "What's one goal you'd like us to achieve together this year?", category: "future", depth: "light", module: "daily", occasion: null },
  { text: "If you could have any superpower for a day, what would it be?", category: "fun", depth: "light", module: "daily", occasion: null },
  
  // Christmas questions
  { text: "What's your favorite Christmas memory with me?", category: "memories", depth: "light", module: "daily", occasion: "christmas" },
  { text: "What Christmas tradition would you like us to start this year?", category: "family", depth: "light", module: "daily", occasion: "christmas" },
  { text: "What's the most meaningful gift you've ever received?", category: "love", depth: "deep", module: "daily", occasion: "christmas" },
  
  // Birthday questions
  { text: "What's the best birthday surprise you've ever had?", category: "memories", depth: "light", module: "daily", occasion: "birthday" },
  { text: "What would make this birthday extra special for you?", category: "desires", depth: "light", module: "daily", occasion: "birthday" },
  { text: "What's something you're most proud of from this past year?", category: "love", depth: "deep", module: "daily", occasion: "birthday" },
  
  // Valentine's Day questions
  { text: "What's the most romantic thing we've done together?", category: "love", depth: "light", module: "daily", occasion: "valentine" },
  { text: "How would you describe our love story to someone?", category: "memories", depth: "deep", module: "daily", occasion: "valentine" },
  { text: "What makes you feel most cherished by me?", category: "love", depth: "deep", module: "daily", occasion: "valentine" },
  
  // Anniversary questions
  { text: "What's your favorite memory from our first year together?", category: "memories", depth: "light", module: "daily", occasion: "anniversary" },
  { text: "How have we grown as a couple since we first met?", category: "love", depth: "deep", module: "daily", occasion: "anniversary" },
  { text: "What are you most excited about for our future together?", category: "future", depth: "deep", module: "daily", occasion: "anniversary" },
  
  // Easter questions
  { text: "What does renewal and new beginnings mean to you in our relationship?", category: "love", depth: "deep", module: "daily", occasion: "easter" },
  { text: "What's a fresh start we could make together this spring?", category: "future", depth: "light", module: "daily", occasion: "easter" },
  
  // New Year questions
  { text: "What's one relationship goal for this new year?", category: "future", depth: "light", module: "daily", occasion: "new_year" },
  { text: "What habit would you like us to build together this year?", category: "desires", depth: "light", module: "daily", occasion: "new_year" },
  
  // Ramadan questions
  { text: "How can we support each other's spiritual growth?", category: "love", depth: "deep", module: "daily", occasion: "ramadan" },
  { text: "What are you most grateful for in our relationship?", category: "love", depth: "light", module: "daily", occasion: "ramadan" },
  
  // Diwali questions
  { text: "What brings the most light and joy to our relationship?", category: "love", depth: "light", module: "daily", occasion: "diwali" },
  { text: "How can we celebrate our love and prosperity together?", category: "family", depth: "light", module: "daily", occasion: "diwali" }
]

async function main() {
  console.log('Seeding database...')
  
  for (const question of defaultQuestions) {
    await prisma.question.create({
      data: {
        ...question,
        isActive: true,
      },
    })
  }
  
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })