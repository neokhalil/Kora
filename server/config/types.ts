/**
 * Types shared across configuration modules
 */

export interface AppConfig {
  environment: string;
  server: {
    port: number | string;
  };
  upload?: {
    maxSize: number;
    directory: string;
  };
  api: {
    openai: {
      apiKey?: string;
    };
  };
  database: {
    url?: string;
    ssl: boolean;
    logging: boolean;
  };
  debug: boolean;
}