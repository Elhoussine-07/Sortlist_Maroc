interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_NOTIFICATIONS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
