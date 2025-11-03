-- Insert default questions (only if they don't exist)
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
('q23', 'What are you most grateful for in our relationship?', 'love', 'deep', 'daily', 'newyear', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_couple_users" ON "Couple"("user1Id", "user2Id");
CREATE INDEX IF NOT EXISTS "idx_daily_question_date" ON "DailyQuestion"("date");
CREATE INDEX IF NOT EXISTS "idx_response_user_couple" ON "Response"("userId", "coupleId");
CREATE INDEX IF NOT EXISTS "idx_message_couple_created" ON "Message"("coupleId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_question_category_active" ON "Question"("category", "isActive");
CREATE INDEX IF NOT EXISTS "idx_question_occasion" ON "Question"("occasion") WHERE "occasion" IS NOT NULL;