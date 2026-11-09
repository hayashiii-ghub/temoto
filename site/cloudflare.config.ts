import { defineConfig } from "cf/config";

export default defineConfig(({ mode }) => {
  if (mode !== undefined && mode !== "preview" && mode !== "production") {
    throw new Error(`Unsupported Cloudflare mode: ${mode}. Use preview or production.`);
  }

  return {
    accountId: "7e0d344d3920f4fa34ccd3b3c4e2a0c7",
    worker: {
      name: mode === "production" ? "temoto-site" : "temoto-site-preview",
      ...(mode === "production" ? { domains: ["temoto.shigoto.dev"] } : {}),
      compatibilityDate: "2026-11-09",
      observability: { enabled: true },
      workersDev: true,
    },
  };
});
