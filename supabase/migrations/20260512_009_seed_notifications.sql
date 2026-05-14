-- ============================================================================
-- Seed: Gamification Notifications for mentor contact-2
-- First expand the check constraint to allow mentor_nudge and seeker_needs_attention
-- ============================================================================

-- Drop the old constraint and add expanded one
ALTER TABLE gamification_notifications
  DROP CONSTRAINT IF EXISTS gamification_notifications_notification_type_check;

ALTER TABLE gamification_notifications
  ADD CONSTRAINT gamification_notifications_notification_type_check
  CHECK (notification_type IN (
    'badge_earned', 'level_up', 'streak_milestone',
    'milestone_completed', 'rank_change',
    'mentor_nudge', 'seeker_needs_attention'
  ));

-- ─── Seed notifications ────────────────────────────────────────────────────

INSERT INTO gamification_notifications (account_id, actor_id, actor_type, notification_type, title, body, payload, is_read)
VALUES
-- Mentor nudge: Sarah silent 5 days, high dropout risk
('tenant-1', 'contact-2', 'mentor', 'mentor_nudge',
 'Sarah needs your attention',
 'Sarah Johnson has been silent for 5 days. Her dropout risk is now High (52%). Consider reaching out with encouragement.',
 '{"seeker_id":"contact-1","seeker_name":"Sarah Johnson","dropout_risk":"high","days_silent":5}'::jsonb,
 false),

-- Mentor nudge: Daniel broke streak, critical risk
('tenant-1', 'contact-2', 'mentor', 'mentor_nudge',
 'Daniel may be dropping off',
 'Daniel Mekonnen broke his 12-day streak and has not returned. Dropout risk is Critical (68%). A personal message could help.',
 '{"seeker_id":"contact-3","seeker_name":"Daniel Mekonnen","dropout_risk":"critical","streak_broken":12}'::jsonb,
 false),

-- Seeker needs attention: Fatima inactive
('tenant-1', 'contact-2', 'mentor', 'seeker_needs_attention',
 'Fatima has not opened the app in 7 days',
 'Fatima Ali was enrolled in the We Miss You drip sequence, but has not responded to any messages yet.',
 '{"seeker_id":"contact-8","seeker_name":"Fatima Ali","days_inactive":7,"drip_template":"we_miss_you"}'::jsonb,
 false),

-- Badge earned
('tenant-1', 'contact-2', 'mentor', 'badge_earned',
 'You earned the Mentor Champion badge!',
 'Congratulations! You have guided 5 seekers through their first milestone. +50 XP',
 '{"badge_slug":"mentor_champion","xp_reward":50}'::jsonb,
 false),

-- Level up
('tenant-1', 'contact-2', 'mentor', 'level_up',
 'Level Up! You reached Level 4',
 'Your dedication is paying off. You are now a Silver tier mentor with 450 XP.',
 '{"new_level":4,"new_tier":"silver","total_xp":450}'::jsonb,
 false),

-- Streak milestone (read)
('tenant-1', 'contact-2', 'mentor', 'streak_milestone',
 '7-day streak! Keep it going',
 'You have been active for 7 days in a row. Your longest streak is 14 days.',
 '{"current_streak":7,"longest_streak":14}'::jsonb,
 true),

-- Milestone completed (read)
('tenant-1', 'contact-2', 'mentor', 'milestone_completed',
 'James completed First Prayer',
 'James Wilson just completed the First Prayer milestone in Foundations of Faith. Great mentoring!',
 '{"seeker_id":"contact-4","seeker_name":"James Wilson","milestone":"First Prayer"}'::jsonb,
 true),

-- Rank change (read)
('tenant-1', 'contact-2', 'mentor', 'rank_change',
 'You moved up to #3 on the leaderboard',
 'Your weekly XP puts you in 3rd place among mentors. Keep engaging with your seekers!',
 '{"old_rank":5,"new_rank":3,"board_type":"weekly"}'::jsonb,
 true)

ON CONFLICT DO NOTHING;

-- Also seed an automation enrollment for contact-1 (Sarah) so mentor sees re-engagement on her detail
INSERT INTO automation_enrollments (account_id, actor_id, actor_type, template_id, status, current_step, metadata_)
SELECT 'tenant-1', 'contact-1', 'seeker', rt.id, 'active', 1, '{"triggered_by":"silence_detection","days_silent":5}'::jsonb
FROM reengagement_templates rt
WHERE rt.slug = 'we_miss_you' AND rt.account_id = 'tenant-1'
ON CONFLICT DO NOTHING;
