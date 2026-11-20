export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://utpost:utpost@localhost:5433/utpost",
  mongoUrl:
    process.env.MONGO_URL ?? "mongodb://localhost:27017/?authSource=admin",
  jwtSecret: process.env.JWT_SECRET ?? "utpost-dev-secret",
  port: Number(process.env.PORT ?? 4000),
  gitSha: process.env.GIT_SHA ?? "dev",
  uploadDir: "./uploads",
  // M7: || och inte ??, så att en tom rad i .env också ger den lokala adressen.
  imageFunctionUrl:
    process.env.IMAGE_FUNCTION_URL || "http://localhost:7071/api/process-image",
  // Tom lokalt: func start kontrollerar ingen nyckel.
  imageFunctionKey: process.env.IMAGE_FUNCTION_KEY ?? "",
  // M9: headless CMS (cms/contentful.js). Space-id:t är ingen hemlighet, nycklarna är det.
  // Saknas de är CMS:et avstängt och appen kör utan notiser.
  cmsSpaceId: process.env.CONTENTFUL_SPACE_ID ?? "",
  cmsEnvironment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  cmsDeliveryToken: process.env.CONTENTFUL_DELIVERY_TOKEN ?? "",
  cmsPreviewToken: process.env.CONTENTFUL_PREVIEW_TOKEN ?? "",
  cmsCacheSeconds: Number(process.env.CMS_CACHE_SECONDS ?? 60),
};
