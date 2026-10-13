CREATE TABLE `theory_evidence` (
	`theory_id` integer NOT NULL,
	`row` integer NOT NULL,
	`col` integer NOT NULL,
	FOREIGN KEY (`theory_id`) REFERENCES `theories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `theory_evidence_unique` ON `theory_evidence` (`theory_id`,`row`,`col`);--> statement-breakpoint
ALTER TABLE `specimens` ADD `note` text;