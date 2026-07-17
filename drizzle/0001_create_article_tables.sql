CREATE TABLE "article_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"commentor_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_favorites" (
	"article_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_favorites_article_id_user_id_pk" PRIMARY KEY("article_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"short_description" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_commentor_id_users_id_fk" FOREIGN KEY ("commentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_favorites" ADD CONSTRAINT "article_favorites_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_favorites" ADD CONSTRAINT "article_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_comments_article_id_idx" ON "article_comments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_comments_commentor_id_idx" ON "article_comments" USING btree ("commentor_id");--> statement-breakpoint
CREATE INDEX "article_favorites_user_id_idx" ON "article_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "articles_author_id_idx" ON "articles" USING btree ("author_id");