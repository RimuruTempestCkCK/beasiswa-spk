export const API = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  DASHBOARD: {
    SUMMARY: '/api/v1/dashboard/summary',
  },
  DATASETS: {
    LIST: '/api/v1/datasets',
    CREATE: '/api/v1/datasets',
    DETAIL: (id) => `/api/v1/datasets/${id}`,
    IMPORT: (id) => `/api/v1/datasets/${id}/import`,
    VALIDATION: (id) => `/api/v1/datasets/${id}/validation`,
    PREVIEW: (id) => `/api/v1/datasets/${id}/preview`,
    DELETE: (id) => `/api/v1/datasets/${id}`,
  },
  RECORDS: {
    LIST: '/api/v1/records',
    CREATE: '/api/v1/records',
    DETAIL: (id) => `/api/v1/records/${id}`,
    UPDATE: (id) => `/api/v1/records/${id}`,
    DELETE: (id) => `/api/v1/records/${id}`,
  },
  PREPROCESSING: {
    RUNS: '/api/v1/preprocessing/runs',
    RUN_DETAIL: (id) => `/api/v1/preprocessing/runs/${id}`,
  },
  CLUSTERING: {
    RUNS: '/api/v1/clustering/runs',
    RUN_DETAIL: (id) => `/api/v1/clustering/runs/${id}`,
    SELECT: (id) => `/api/v1/clustering/runs/${id}/select`,
    ASSIGNMENTS: (id) => `/api/v1/clustering/runs/${id}/assignments`,
    PROFILE: (id) => `/api/v1/clustering/runs/${id}/profile`,
  },
  MODELS: {
    TRAIN: '/api/v1/models/train',
    LIST: '/api/v1/models',
    ACTIVE: '/api/v1/models/active',
    DETAIL: (id) => `/api/v1/models/${id}`,
    SET_READY: (id) => `/api/v1/models/${id}/set-ready`,
    ARCHIVE: (id) => `/api/v1/models/${id}/archive`,
  },
  PREDICTIONS: {
    CREATE: '/api/v1/predictions',
    LIST: '/api/v1/predictions',
  },
  REPORTS: {
    EXPERIMENTS: '/api/v1/reports/experiments',
    EXPORT_PREDICTIONS: '/api/v1/reports/export/predictions',
  },
  USERS: {
    LIST: '/api/v1/users',
    CREATE: '/api/v1/users',
    UPDATE: (id) => `/api/v1/users/${id}`,
    DELETE: (id) => `/api/v1/users/${id}`,
  },
  AUDIT_LOGS: '/api/v1/audit-logs',
};
