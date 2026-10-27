CREATE TABLE `dig_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`day` text NOT NULL,
	`cost` integer NOT NULL,
	`purchased_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dig_purchases_visitor_day` ON `dig_purchases` (`visitor_id`,`day`);--> statement-breakpoint
CREATE TABLE `trivia_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`day` text NOT NULL,
	`correct` integer NOT NULL,
	`answered_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trivia_answers_unique` ON `trivia_answers` (`visitor_id`,`day`);--> statement-breakpoint
ALTER TABLE `visitors` ADD `shards` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `visitors` ADD `trivia_streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `visitors` ADD `last_trivia_day` text;