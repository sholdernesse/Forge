import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { PublicDocumentPage, publicDocumentForPath, supportEmailFromEnvironment } from './PublicDocumentPage.js';
import './styles.css';

const environment = (import.meta as ImportMeta & { env: Record<string, unknown> }).env;
const publicDocument = publicDocumentForPath(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>{publicDocument
    ? <PublicDocumentPage kind={publicDocument} supportEmail={supportEmailFromEnvironment(environment)} />
    : <App />}</StrictMode>,
);
