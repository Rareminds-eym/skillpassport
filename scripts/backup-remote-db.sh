#!/usr/bin/env bash
# ==============================================================================
# SkillPassport - Remote Database Backup Wrapper (IEEE 730 / DORA 2026 Compliant)
# ==============================================================================
# Forwards calls to the industrial-grade Python engine scripts/backup_remote_db.py
#
# Usage:
#   bash scripts/backup-remote-db.sh                  # Full backup (schema + seed + roles)
#   bash scripts/backup-remote-db.sh --schema-only    # Dump only migration schema (DDL)
#   bash scripts/backup-remote-db.sh --seed-only      # Dump only seed data (DML)
#   bash scripts/backup-remote-db.sh --public-only    # Dump only public schema seed data
#   bash scripts/backup-remote-db.sh --compress       # Compress with Gzip (.gz)
#   bash scripts/backup-remote-db.sh --verify latest  # Cryptographic SHA-256 verification
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

exec python3 "${SCRIPT_DIR}/backup_remote_db.py" "$@"
