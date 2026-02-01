import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { initOfflineSystem } from './lib/offlineIntegration';
import { setupGlobalErrorHandlers, logger } from './lib/logger';
import { validateConfig, isProduction } from './lib/config';

// Setup global error handlers for logging
setupGlobalErrorHandlers();

// Validate configuration in production
if (isProduction) {
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    logger.error('Configuration validation failed', { errors: configValidation.errors });
  }
}

// Initialize offline system (IndexedDB + SyncManager)
initOfflineSystem().then(() => {
  logger.info('Offline system initialized');
}).catch((error) => {
  logger.error('Offline system initialization failed', error);
});

render(<App />, document.getElementById("root"));