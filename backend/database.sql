-- Create all tables first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- User profiles table
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "gender" TEXT,
    "birthday" TIMESTAMP(3),
    "religion" TEXT,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "notificationPreferences" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- Couples table
CREATE TABLE "Couple" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "connectionCode" TEXT NOT NULL,
    "anniversaryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- Questions table
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "depth" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'daily',
    "occasion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- Daily questions table
CREATE TABLE "DailyQuestion" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- Responses table
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "dailyQuestionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- Game results table
CREATE TABLE "GameResult" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

-- Exercises table
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- Quiz table
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "quizType" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- Messages table
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "Couple_connectionCode_key" ON "Couple"("connectionCode");
CREATE UNIQUE INDEX "DailyQuestion_coupleId_date_key" ON "DailyQuestion"("coupleId", "date");

-- Add foreign key constraints
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyQuestion" ADD CONSTRAINT "DailyQuestion_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyQuestion" ADD CONSTRAINT "DailyQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_dailyQuestionId_fkey" FOREIGN KEY ("dailyQuestionId") REFERENCES "DailyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default questions
INSERT INTO "Question" (id, text, category, depth, module, occasion, "isActive") VALUES
-- Regular questions
('q1', 'What''s a small, non-physical thing I did recently that made you feel loved?', 'love', 'light', 'daily', NULL, true),
('q2', 'What''s one thing you appreciate about our relationship?', 'love', 'deep', 'daily', NULL, true),
('q3', 'What''s a memory from our early days that still makes you smile?', 'memories', 'light', 'daily', NULL, true),
('q4', 'What''s a skill or hobby you''d love for us to learn together?', 'desires', 'light', 'daily', NULL, true),
('q5', 'What''s one goal you''d like us to achieve together this year?', 'future', 'light', 'daily', NULL, true),
('q6', 'If you could have any superpower for a day, what would it be?', 'fun', 'light', 'daily', NULL, true),

-- Christmas questions
('q7', 'What''s your favorite Christmas memory with me?', 'memories', 'light', 'daily', 'christmas', true),
('q8', 'What Christmas tradition would you like us to start this year?', 'family', 'light', 'daily', 'christmas', true),
('q9', 'What''s the most meaningful gift you''ve ever received?', 'love', 'deep', 'daily', 'christmas', true),

-- Birthday questions
('q10', 'What''s the best birthday surprise you''ve ever had?', 'memories', 'light', 'daily', 'birthday', true),
('q11', 'What would make this birthday extra special for you?', 'desires', 'light', 'daily', 'birthday', true),
('q12', 'What''s something you''re most proud of from this past year?', 'love', 'deep', 'daily', 'birthday', true),

-- Valentine's Day questions
('q13', 'What''s the most romantic thing we''ve done together?', 'love', 'light', 'daily', 'valentine', true),
('q14', 'How would you describe our love story to someone?', 'memories', 'deep', 'daily', 'valentine', true),
('q15', 'What makes you feel most cherished by me?', 'love', 'deep', 'daily', 'valentine', true),

-- Anniversary questions
('q16', 'What''s your favorite memory from our first year together?', 'memories', 'light', 'daily', 'anniversary', true),
('q17', 'How have we grown as a couple since we first met?', 'love', 'deep', 'daily', 'anniversary', true),
('q18', 'What are you most excited about for our future together?', 'future', 'deep', 'daily', 'anniversary', true),

-- Easter questions
('q19', 'What does renewal and new beginnings mean to you in our relationship?', 'love', 'deep', 'daily', 'easter', true),
('q20', 'What''s a fresh start we could make together this spring?', 'future', 'light', 'daily', 'easter', true),

-- New Year questions
('q21', 'What''s one relationship goal for this year?', 'future', 'light', 'daily', 'newyear', true),
('q22', 'What''s something you want to leave behind from last year?', 'growth', 'deep', 'daily', 'newyear', true),
('q23', 'What are you most grateful for in our relationship?', 'love', 'deep', 'daily', 'newyear', true);

-- Create indexes for better performance
CREATE INDEX "idx_couple_users" ON "Couple"("user1Id", "user2Id");
CREATE INDEX "idx_daily_question_date" ON "DailyQuestion"("date");
CREATE INDEX "idx_response_user_couple" ON "Response"("userId", "coupleId");
CREATE INDEX "idx_message_couple_created" ON "Message"("coupleId", "createdAt");
CREATE INDEX "idx_question_category_active" ON "Question"("category", "isActive");
CREATE INDEX "idx_question_occasion" ON "Question"("occasion") WHERE "occasion" IS NOT NULL;