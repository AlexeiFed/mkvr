-- Добавляем поля в таблицу sub_services
ALTER TABLE "sub_services" ADD COLUMN "description" TEXT;
ALTER TABLE "sub_services" ADD COLUMN "avatar" TEXT;
ALTER TABLE "sub_services" ADD COLUMN "photos" TEXT[] DEFAULT '{}';
ALTER TABLE "sub_services" ADD COLUMN "video" TEXT;

-- Добавляем поля в таблицу sub_service_variants
ALTER TABLE "sub_service_variants" ADD COLUMN "description" TEXT;
ALTER TABLE "sub_service_variants" ADD COLUMN "avatar" TEXT;
ALTER TABLE "sub_service_variants" ADD COLUMN "photos" TEXT[] DEFAULT '{}';
ALTER TABLE "sub_service_variants" ADD COLUMN "video" TEXT;
ALTER TABLE "sub_service_variants" ADD COLUMN "order" INTEGER DEFAULT 0;
