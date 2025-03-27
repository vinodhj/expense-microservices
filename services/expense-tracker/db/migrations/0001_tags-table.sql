CREATE TABLE `expense_tags` (
    `id` text PRIMARY KEY,
    `name` text NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    `created_by` text NOT NULL,
    `updated_by` text NOT NULL,
    `is_disabled` INTEGER DEFAULT 0 CHECK(`is_disabled` IN (0, 1))
);

-- Create unique index
CREATE UNIQUE INDEX `idx_unique_tags_name` ON `expense_tags`(`name`);