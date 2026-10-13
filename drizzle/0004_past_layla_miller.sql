ALTER TABLE `sites` ADD `solved_by` text;--> statement-breakpoint
-- The made-up placeholder site is retired for the famous ones: close it and
-- bury the first of them in its place.
UPDATE `sites` SET `closed_at` = datetime('now') WHERE `id` = 'placeholder' AND `closed_at` IS NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `sites` (`id`) SELECT 'site-1' WHERE NOT EXISTS (SELECT 1 FROM `sites` WHERE `closed_at` IS NULL);
