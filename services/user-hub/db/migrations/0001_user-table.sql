CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text UNIQUE NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`phone` text UNIQUE NOT NULL,
	`address` text NULL,
	`city` text NULL,
	`state` text NULL,
	`country` text NULL,
	`zipcode` text NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL
);

CREATE INDEX idx_email ON user (`email`);
CREATE INDEX idx_phone ON user (`phone`);
CREATE UNIQUE INDEX `composite_email_phone` ON `user` (`email`,`phone`);