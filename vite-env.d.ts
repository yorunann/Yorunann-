/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** scoresheet API relay base. Defaults to the Vite dev proxy at /scoresheet-api */
  readonly VITE_SCORESHEET_API_BASE?: string;
}
