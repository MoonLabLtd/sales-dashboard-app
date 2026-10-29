CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`category_id` text,
	`default_price_minor` integer NOT NULL,
	`default_cost_minor` integer,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
--> statement-breakpoint
CREATE INDEX `products_archived_idx` ON `products` (`archived_at`);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`name`);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`order_ref` text NOT NULL,
	`status` text NOT NULL,
	`payment_method` text NOT NULL,
	`customer_id` text,
	`customer_name_snapshot` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`subtotal_minor` integer NOT NULL,
	`discount_minor` integer NOT NULL,
	`net_minor` integer NOT NULL,
	`tax_bps` integer NOT NULL,
	`tax_minor` integer NOT NULL,
	`total_minor` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_order_ref_unique` ON `sales` (`order_ref`);
--> statement-breakpoint
CREATE INDEX `sales_occurred_idx` ON `sales` (`occurred_at`);
--> statement-breakpoint
CREATE INDEX `sales_status_idx` ON `sales` (`status`);
--> statement-breakpoint
CREATE INDEX `sales_payment_idx` ON `sales` (`payment_method`);
--> statement-breakpoint
CREATE INDEX `sales_customer_idx` ON `sales` (`customer_id`);
--> statement-breakpoint
CREATE TABLE `sale_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`product_name_snapshot` text NOT NULL,
	`category_name_snapshot` text,
	`quantity` integer NOT NULL,
	`unit_price_minor` integer NOT NULL,
	`unit_cost_minor` integer,
	`line_subtotal_minor` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sale_lines_sale_idx` ON `sale_lines` (`sale_id`);
--> statement-breakpoint
CREATE INDEX `sale_lines_product_idx` ON `sale_lines` (`product_id`);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`currency` text NOT NULL,
	`locale` text NOT NULL,
	`date_format` text NOT NULL,
	`default_range` text NOT NULL,
	`theme` text NOT NULL,
	`backup_dir` text,
	`demo_loaded` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `settings` (`id`,`currency`,`locale`,`date_format`,`default_range`,`theme`,`backup_dir`,`demo_loaded`,`updated_at`) VALUES (1,'USD','en-US','MMM d, yyyy','last30','system','data/backups',0,0);
--> statement-breakpoint
CREATE TABLE `demo_marker` (
	`id` integer PRIMARY KEY NOT NULL,
	`seed` text NOT NULL,
	`loaded_at` integer NOT NULL
);
