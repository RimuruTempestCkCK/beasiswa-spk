-- ============================================================
-- Schema Database: beasiswa_spk
-- Sistem Pendukung Keputusan Prediksi Kelayakan Beasiswa
-- Versi: 1.0 | Tanggal: 24 Oktober 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS beasiswa_spk
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE beasiswa_spk;

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','operator','reviewer') NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: dataset_batches
-- ============================================================
CREATE TABLE IF NOT EXISTS dataset_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_name VARCHAR(150) NOT NULL,
  source_filename VARCHAR(255),
  source_type ENUM('excel','csv','manual','synthetic') NOT NULL DEFAULT 'csv',
  dataset_description TEXT,
  total_rows INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','imported','validated','rejected') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batch_user FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: student_records
-- Enam fitur analitik: ipk, parent_income, family_dependents,
-- academic_achievement_score, nonacademic_achievement_score,
-- attendance_percentage
-- ============================================================
CREATE TABLE IF NOT EXISTS student_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dataset_batch_id BIGINT UNSIGNED NOT NULL,
  student_code VARCHAR(60) NULL,
  student_name VARCHAR(150) NULL,
  ipk DECIMAL(4,2) NULL,
  parent_income DECIMAL(15,2) NULL,
  family_dependents SMALLINT UNSIGNED NULL,
  academic_achievement_score DECIMAL(8,3) NULL,
  nonacademic_achievement_score DECIMAL(8,3) NULL,
  attendance_percentage DECIMAL(5,2) NULL,
  data_status ENUM('raw','validated','invalid') NOT NULL DEFAULT 'raw',
  validation_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_record_batch FOREIGN KEY (dataset_batch_id)
    REFERENCES dataset_batches(id) ON DELETE CASCADE,
  INDEX idx_record_batch (dataset_batch_id),
  INDEX idx_record_code (student_code)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: preprocessing_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS preprocessing_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dataset_batch_id BIGINT UNSIGNED NOT NULL,
  method_version VARCHAR(50) NOT NULL,
  config JSON NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  input_rows INT UNSIGNED NOT NULL DEFAULT 0,
  output_rows INT UNSIGNED NOT NULL DEFAULT 0,
  artifact_path VARCHAR(500) NULL,
  error_message TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_batch_id) REFERENCES dataset_batches(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: clustering_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS clustering_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  preprocessing_run_id BIGINT UNSIGNED NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'KMeans',
  k_value INT UNSIGNED NOT NULL,
  dbi_score DECIMAL(12,8) NULL,
  random_seed INT NULL,
  config JSON NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  artifact_path VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (preprocessing_run_id) REFERENCES preprocessing_runs(id),
  INDEX idx_cluster_preprocess (preprocessing_run_id)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: cluster_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS cluster_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clustering_run_id BIGINT UNSIGNED NOT NULL,
  student_record_id BIGINT UNSIGNED NOT NULL,
  cluster_label INT NOT NULL,
  distance_to_centroid DECIMAL(14,8) NULL,
  FOREIGN KEY (clustering_run_id) REFERENCES clustering_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_record_id) REFERENCES student_records(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cluster_record (clustering_run_id, student_record_id)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: model_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS model_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(150) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  target_clustering_run_id BIGINT UNSIGNED NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'Backpropagation',
  training_config JSON NULL,
  metrics JSON NULL,
  artifact_path VARCHAR(500) NULL,
  status ENUM('training','ready','failed','archived') NOT NULL DEFAULT 'training',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_clustering_run_id) REFERENCES clustering_runs(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_model_version (model_name, model_version)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: predictions
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_version_id BIGINT UNSIGNED NOT NULL,
  ipk DECIMAL(4,2) NOT NULL,
  parent_income DECIMAL(15,2) NOT NULL,
  family_dependents SMALLINT UNSIGNED NOT NULL,
  academic_achievement_score DECIMAL(8,3) NOT NULL,
  nonacademic_achievement_score DECIMAL(8,3) NOT NULL,
  attendance_percentage DECIMAL(5,2) NOT NULL,
  predicted_cluster INT NOT NULL,
  confidence_score DECIMAL(8,7) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_version_id) REFERENCES model_versions(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_prediction_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NULL,
  details_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB;
