CREATE TABLE `expense_tracker` (
    `id` TEXT PRIMARY KEY,
    `user_id` TEXT NOT NULL,
    `expense_period` TEXT NOT NULL,
    `amount` REAL NOT NULL,
    `description` TEXT,
    `item_details` TEXT,
    `tag_id` TEXT NOT NULL,
    `mode_id` TEXT NOT NULL,
    `fynix_id` TEXT NOT NULL,
    `status` TEXT NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    `created_by` text NOT NULL,
    `updated_by` text NOT NULL,
    `is_disabled` INTEGER DEFAULT 0 CHECK(`is_disabled` IN (0, 1)),
    -- Foreign key constraints
    FOREIGN KEY (`tag_id`) REFERENCES `expense_tags`(`id`) ON UPDATE restrict ON DELETE restrict,
    FOREIGN KEY (`mode_id`) REFERENCES `expense_modes`(`id`) ON UPDATE restrict ON DELETE restrict,
    FOREIGN KEY (`fynix_id`) REFERENCES `expense_fynix`(`id`) ON UPDATE restrict ON DELETE restrict
);

-- Indexes for performance optimization
CREATE INDEX `idx_expense_tracker_user_id` ON `expense_tracker` (`user_id`);

CREATE INDEX `idx_user_expense_period` ON `expense_tracker` (`user_id`, `expense_period`);

CREATE INDEX `idx_foreign_keys` ON `expense_tracker` (`tag_id`, `mode_id`, `fynix_id`);

CREATE INDEX `composite_tag_amount` ON `expense_tracker` (`tag_id`, `amount`);

CREATE INDEX `composite_mode_amount` ON `expense_tracker` (`mode_id`, `amount`);

CREATE INDEX `composite_fynix_amount` ON `expense_tracker` (`fynix_id`, `amount`);