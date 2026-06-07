-- ============================================================
-- Migration: Remove stale `status` column from `tables`
-- ------------------------------------------------------------
-- Real table availability is computed dynamically from the
-- `reservations` table (see api/tables.php). The static
-- `status` column drifts immediately after reservations are
-- made and is therefore misleading and redundant.
-- ============================================================
-- Run this ONCE in phpMyAdmin > SQL tab on database: reserve-hub
-- ============================================================

ALTER TABLE `tables` DROP COLUMN `status`;
