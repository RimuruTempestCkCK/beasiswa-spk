-- ============================================================
-- Seed Data Development: beasiswa_spk
-- PERHATIAN: Hanya untuk keperluan pengembangan dan testing
-- Jangan gunakan di production
-- ============================================================

USE beasiswa_spk;

-- Admin user default (password: admin123)
-- Hash bcrypt dari 'admin123'
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
('Administrator', 'admin@beasiswa.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMBs65l5EyGz1Cn4fZLl3OZDQO', 'admin', TRUE),
('Operator Satu', 'operator@beasiswa.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMBs65l5EyGz1Cn4fZLl3OZDQO', 'operator', TRUE),
('Penelaah Satu', 'reviewer@beasiswa.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMBs65l5EyGz1Cn4fZLl3OZDQO', 'reviewer', TRUE);

-- Dataset batch sintetis
INSERT INTO dataset_batches (batch_name, source_type, dataset_description, total_rows, status, created_by) VALUES
('Dataset Sintetis 2026 [DEV]', 'synthetic', 'Dataset sintetis untuk pengujian aplikasi. BUKAN data penelitian nyata.', 50, 'imported', 1);

-- Student records sintetis (50 records)
-- Enam fitur: ipk, parent_income, family_dependents, academic_achievement_score, nonacademic_achievement_score, attendance_percentage
INSERT INTO student_records 
  (dataset_batch_id, student_code, student_name, ipk, parent_income, family_dependents, 
   academic_achievement_score, nonacademic_achievement_score, attendance_percentage, data_status)
VALUES
(1, 'SYN001', 'Mahasiswa Sintetis 01', 3.75, 1500000, 3, 3.0, 2.0, 95.00, 'validated'),
(1, 'SYN002', 'Mahasiswa Sintetis 02', 2.90, 3500000, 1, 1.0, 1.0, 80.00, 'validated'),
(1, 'SYN003', 'Mahasiswa Sintetis 03', 3.50, 1200000, 4, 2.0, 3.0, 92.00, 'validated'),
(1, 'SYN004', 'Mahasiswa Sintetis 04', 2.50, 5000000, 2, 0.0, 0.0, 70.00, 'validated'),
(1, 'SYN005', 'Mahasiswa Sintetis 05', 3.85, 800000, 5, 4.0, 3.0, 98.00, 'validated'),
(1, 'SYN006', 'Mahasiswa Sintetis 06', 3.10, 2000000, 2, 2.0, 1.0, 85.00, 'validated'),
(1, 'SYN007', 'Mahasiswa Sintetis 07', 2.70, 4500000, 1, 0.0, 2.0, 75.00, 'validated'),
(1, 'SYN008', 'Mahasiswa Sintetis 08', 3.60, 1000000, 4, 3.0, 2.0, 90.00, 'validated'),
(1, 'SYN009', 'Mahasiswa Sintetis 09', 2.30, 6000000, 0, 0.0, 0.0, 65.00, 'validated'),
(1, 'SYN010', 'Mahasiswa Sintetis 10', 3.90, 900000, 5, 4.0, 4.0, 99.00, 'validated'),
(1, 'SYN011', 'Mahasiswa Sintetis 11', 3.20, 2500000, 3, 1.0, 1.0, 82.00, 'validated'),
(1, 'SYN012', 'Mahasiswa Sintetis 12', 2.80, 3000000, 2, 1.0, 0.0, 78.00, 'validated'),
(1, 'SYN013', 'Mahasiswa Sintetis 13', 3.70, 1100000, 4, 3.0, 3.0, 94.00, 'validated'),
(1, 'SYN014', 'Mahasiswa Sintetis 14', 2.40, 7000000, 1, 0.0, 0.0, 68.00, 'validated'),
(1, 'SYN015', 'Mahasiswa Sintetis 15', 3.45, 1800000, 3, 2.0, 2.0, 88.00, 'validated'),
(1, 'SYN016', 'Mahasiswa Sintetis 16', 2.60, 4000000, 2, 0.0, 1.0, 72.00, 'validated'),
(1, 'SYN017', 'Mahasiswa Sintetis 17', 3.80, 750000, 5, 4.0, 3.0, 97.00, 'validated'),
(1, 'SYN018', 'Mahasiswa Sintetis 18', 3.00, 3200000, 1, 1.0, 1.0, 81.00, 'validated'),
(1, 'SYN019', 'Mahasiswa Sintetis 19', 2.20, 8000000, 0, 0.0, 0.0, 62.00, 'validated'),
(1, 'SYN020', 'Mahasiswa Sintetis 20', 3.95, 700000, 6, 4.0, 4.0, 100.00, 'validated'),
(1, 'SYN021', 'Mahasiswa Sintetis 21', 3.30, 2200000, 3, 2.0, 1.0, 84.00, 'validated'),
(1, 'SYN022', 'Mahasiswa Sintetis 22', 2.75, 3800000, 2, 0.0, 1.0, 76.00, 'validated'),
(1, 'SYN023', 'Mahasiswa Sintetis 23', 3.55, 1300000, 4, 3.0, 2.0, 91.00, 'validated'),
(1, 'SYN024', 'Mahasiswa Sintetis 24', 2.45, 5500000, 1, 0.0, 0.0, 67.00, 'validated'),
(1, 'SYN025', 'Mahasiswa Sintetis 25', 3.65, 1050000, 5, 3.0, 3.0, 93.00, 'validated'),
(1, 'SYN026', 'Mahasiswa Sintetis 26', 2.95, 2800000, 2, 1.0, 0.0, 79.00, 'validated'),
(1, 'SYN027', 'Mahasiswa Sintetis 27', 3.15, 1900000, 3, 2.0, 2.0, 86.00, 'validated'),
(1, 'SYN028', 'Mahasiswa Sintetis 28', 2.55, 4200000, 1, 0.0, 1.0, 73.00, 'validated'),
(1, 'SYN029', 'Mahasiswa Sintetis 29', 3.82, 850000, 5, 4.0, 3.0, 96.00, 'validated'),
(1, 'SYN030', 'Mahasiswa Sintetis 30', 3.05, 3100000, 2, 1.0, 1.0, 80.50, 'validated'),
(1, 'SYN031', 'Mahasiswa Sintetis 31', 2.35, 6500000, 0, 0.0, 0.0, 64.00, 'validated'),
(1, 'SYN032', 'Mahasiswa Sintetis 32', 3.88, 780000, 5, 4.0, 4.0, 98.50, 'validated'),
(1, 'SYN033', 'Mahasiswa Sintetis 33', 3.25, 2100000, 3, 2.0, 1.0, 83.00, 'validated'),
(1, 'SYN034', 'Mahasiswa Sintetis 34', 2.65, 4100000, 2, 0.0, 0.0, 74.00, 'validated'),
(1, 'SYN035', 'Mahasiswa Sintetis 35', 3.48, 1400000, 4, 2.0, 2.0, 89.00, 'validated'),
(1, 'SYN036', 'Mahasiswa Sintetis 36', 2.42, 5800000, 1, 0.0, 0.0, 66.00, 'validated'),
(1, 'SYN037', 'Mahasiswa Sintetis 37', 3.72, 980000, 5, 3.0, 3.0, 95.50, 'validated'),
(1, 'SYN038', 'Mahasiswa Sintetis 38', 2.88, 3300000, 2, 1.0, 0.0, 77.00, 'validated'),
(1, 'SYN039', 'Mahasiswa Sintetis 39', 3.18, 2050000, 3, 2.0, 1.0, 85.50, 'validated'),
(1, 'SYN040', 'Mahasiswa Sintetis 40', 2.58, 4300000, 1, 0.0, 1.0, 71.00, 'validated'),
(1, 'SYN041', 'Mahasiswa Sintetis 41', 3.78, 820000, 5, 4.0, 3.0, 96.50, 'validated'),
(1, 'SYN042', 'Mahasiswa Sintetis 42', 3.08, 2900000, 2, 1.0, 1.0, 81.50, 'validated'),
(1, 'SYN043', 'Mahasiswa Sintetis 43', 2.28, 7500000, 0, 0.0, 0.0, 63.00, 'validated'),
(1, 'SYN044', 'Mahasiswa Sintetis 44', 3.92, 720000, 6, 4.0, 4.0, 99.50, 'validated'),
(1, 'SYN045', 'Mahasiswa Sintetis 45', 3.35, 2300000, 3, 2.0, 2.0, 87.00, 'validated'),
(1, 'SYN046', 'Mahasiswa Sintetis 46', 2.72, 3700000, 2, 0.0, 1.0, 75.50, 'validated'),
(1, 'SYN047', 'Mahasiswa Sintetis 47', 3.52, 1250000, 4, 3.0, 2.0, 90.50, 'validated'),
(1, 'SYN048', 'Mahasiswa Sintetis 48', 2.48, 5200000, 1, 0.0, 0.0, 69.00, 'validated'),
(1, 'SYN049', 'Mahasiswa Sintetis 49', 3.68, 1020000, 4, 3.0, 3.0, 92.50, 'validated'),
(1, 'SYN050', 'Mahasiswa Sintetis 50', 2.98, 3050000, 2, 1.0, 0.0, 80.00, 'validated');
