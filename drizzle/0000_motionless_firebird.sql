CREATE TABLE `digs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` text NOT NULL,
	`row` integer NOT NULL,
	`col` integer NOT NULL,
	`visitor_id` text NOT NULL,
	`dug_at` text NOT NULL,
	`day` text NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `digs_site_cell` ON `digs` (`site_id`,`row`,`col`);--> statement-breakpoint
CREATE INDEX `digs_visitor_day` ON `digs` (`visitor_id`,`day`);--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`opened_at` text DEFAULT (datetime('now')) NOT NULL,
	`closed_at` text
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
