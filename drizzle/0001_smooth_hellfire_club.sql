CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`body` text NOT NULL,
	`posted_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notes_site` ON `notes` (`site_id`);--> statement-breakpoint
CREATE TABLE `specimens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`site_id` text NOT NULL,
	`row` integer NOT NULL,
	`col` integer NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `specimens_visitor_site` ON `specimens` (`visitor_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `specimens_unique` ON `specimens` (`visitor_id`,`site_id`,`row`,`col`);--> statement-breakpoint
CREATE TABLE `theories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`body` text NOT NULL,
	`posted_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `theories_site` ON `theories` (`site_id`);--> statement-breakpoint
ALTER TABLE `digs` ADD `brushed_at` text;--> statement-breakpoint
ALTER TABLE `digs` ADD `brushed_by` text REFERENCES visitors(id);