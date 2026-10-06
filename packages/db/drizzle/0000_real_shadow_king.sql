CREATE TABLE "download_snapshots" (
	"slug" text NOT NULL,
	"day" date NOT NULL,
	"total" integer NOT NULL,
	CONSTRAINT "download_snapshots_slug_day_pk" PRIMARY KEY("slug","day")
);
