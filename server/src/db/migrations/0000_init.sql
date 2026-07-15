CREATE TABLE `challenge_players` (
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`score` integer,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`challenge_id`, `user_id`),
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`language` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`language` text NOT NULL,
	`final_score` integer NOT NULL,
	`words_found` integer NOT NULL,
	`total_words` integer NOT NULL,
	`grids_completed` integer NOT NULL,
	`total_grids` integer NOT NULL,
	`remaining_seconds` integer NOT NULL,
	`time_bonus` integer NOT NULL,
	`status` text NOT NULL,
	`played_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `practice_rounds_user_id_idx` ON `practice_rounds` (`user_id`);--> statement-breakpoint
CREATE TABLE `practice_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_games` integer DEFAULT 0 NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`average_score` real DEFAULT 0 NOT NULL,
	`total_words_found` integer DEFAULT 0 NOT NULL,
	`total_grids_completed` integer DEFAULT 0 NOT NULL,
	`last_played_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`username` text NOT NULL,
	`language_pref` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);