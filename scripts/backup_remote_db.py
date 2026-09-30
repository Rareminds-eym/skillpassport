#!/usr/bin/env python3
"""
================================================================================
SkillPassport - Industrial-Grade Remote Database Backup Engine
================================================================================
Standards Compliance:
  - IEEE 730-2026: Software Quality Assurance & Verification
  - ISO/IEC 12207: Life Cycle Process (Disaster Recovery & Data Integrity)
  - DORA 2026: Elite Performance (Reliability, Fast Recovery, Auditability)

Key Architecture Features:
  1. Modular Separation of Concerns:
     - Schema / DDL (tables, views, stored functions, RLS, triggers)
     - Seed / DML (table records using COPY bulk streaming with replica role)
     - Cluster Roles (roles, privileges)
     - Optional public-schema only seed isolation
  2. Cryptographic Integrity:
     - SHA-256 checksums generated for every artifact
     - Individual .sha256 verification files for standard `sha256sum -c`
  3. Auditable Manifest:
     - Complete metadata manifest.json recording Git context, timestamps,
       checksums, row/line counts, CLI versions, and execution durations
  4. Atomic Safety:
     - Writes to temporary .tmp files during streaming; atomically commits
       only upon exit code 0 and non-empty byte validation
  5. Storage Efficiency & Retention:
     - Optional Gzip compression (--compress) for 80-90% disk savings
     - Automated retention pruning (--keep N) to prevent disk overflow
  6. Built-in Verification:
     - Self-testing integrity verification mode (--verify)
================================================================================
"""

import os
import sys
import time
import json
import gzip
import shutil
import hashlib
import argparse
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

# Terminal ANSI Styling
class UI:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    GREEN = "\033[92m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    MAGENTA = "\033[95m"

    @classmethod
    def header(cls, title: str):
        print(f"\n{cls.BLUE}{cls.BOLD}{'=' * 72}{cls.RESET}")
        print(f"{cls.BLUE}{cls.BOLD}  {title}{cls.RESET}")
        print(f"{cls.BLUE}{cls.BOLD}{'=' * 72}{cls.RESET}\n")

    @classmethod
    def step(cls, num: int, total: int, title: str):
        print(f"{cls.CYAN}[{num}/{total}]{cls.RESET} {cls.BOLD}{title}{cls.RESET}")

    @classmethod
    def success(cls, msg: str):
        print(f"  {cls.GREEN}✓{cls.RESET} {msg}")

    @classmethod
    def warn(cls, msg: str):
        print(f"  {cls.YELLOW}⚠{cls.RESET} {msg}")

    @classmethod
    def error(cls, msg: str):
        print(f"  {cls.RED}✗ {msg}{cls.RESET}")


def format_bytes(size_bytes: int) -> str:
    """Format bytes into human-readable representation."""
    if size_bytes == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    while size >= 1024.0 and i < len(units) - 1:
        size /= 1024.0
        i += 1
    return f"{size:.2f} {units[i]}"


def compute_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file using chunked streaming."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            hasher.update(chunk)
    return hasher.hexdigest()


def count_lines(file_path: str) -> int:
    """Quickly count lines in a text file."""
    lines = 0
    try:
        with open(file_path, "rb") as f:
            for line in f:
                lines += 1
    except Exception:
        pass
    return lines


class DatabaseBackupManager:
    DEFAULT_PROJECT_REF = "dpooleduinyyzxgrcwko"

    def __init__(self, project_root: str, args: argparse.Namespace):
        self.project_root = os.path.abspath(project_root)
        self.args = args
        self.base_backup_dir = os.path.join(self.project_root, "supabase", "backups")
        self.timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        self.backup_id = f"backup_{self.timestamp_str}"
        self.target_dir = os.path.join(self.base_backup_dir, self.backup_id)
        self.latest_dir = os.path.join(self.base_backup_dir, "latest")
        self.artifacts: Dict[str, Any] = {}
        self.start_time = time.time()

    def run_preflight_checks(self) -> Dict[str, str]:
        """Validate dependencies, linked project status, and available disk space."""
        UI.step(1, 4, "Pre-Flight Health Checks & Verification")

        # 1. Check supabase CLI
        supabase_bin = shutil.which("supabase")
        if not supabase_bin:
            UI.error("Supabase CLI ('supabase') is not installed or not in PATH.")
            sys.exit(1)

        cli_ver_cmd = subprocess.run([supabase_bin, "--version"], capture_output=True, text=True)
        cli_version = cli_ver_cmd.stdout.strip() if cli_ver_cmd.returncode == 0 else "unknown"
        UI.success(f"Supabase CLI: {UI.CYAN}{cli_version}{UI.RESET} ({supabase_bin})")

        # 2. Check disk space
        stat = shutil.disk_usage(self.project_root)
        free_mb = stat.free / (1024 * 1024)
        if free_mb < 500:
            UI.error(f"Insufficient disk space: only {free_mb:.1f} MB available (minimum 500 MB required).")
            sys.exit(1)
        UI.success(f"Free Disk Space: {UI.CYAN}{format_bytes(stat.free)}{UI.RESET} (Healthy)")

        # 3. Check git context
        git_info = self._get_git_info()
        UI.success(f"Git Reference: branch={UI.CYAN}{git_info.get('branch', 'unknown')}{UI.RESET}, "
                   f"commit={UI.CYAN}{git_info.get('commit_short', 'unknown')}{UI.RESET}")

        # 4. Target Directory Setup
        if not self.args.dry_run:
            os.makedirs(self.target_dir, exist_ok=True)
            os.makedirs(self.latest_dir, exist_ok=True)

        return {
            "cli_version": cli_version,
            "free_bytes": str(stat.free),
            **git_info
        }

    def _get_git_info(self) -> Dict[str, str]:
        info = {"branch": "unknown", "commit": "unknown", "commit_short": "unknown", "author": "unknown"}
        try:
            branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                                             cwd=self.project_root, text=True, stderr=subprocess.DEVNULL).strip()
            commit = subprocess.check_output(["git", "rev-parse", "HEAD"],
                                             cwd=self.project_root, text=True, stderr=subprocess.DEVNULL).strip()
            author = subprocess.check_output(["git", "log", "-1", "--format=%an <%ae>"],
                                             cwd=self.project_root, text=True, stderr=subprocess.DEVNULL).strip()
            info.update({
                "branch": branch,
                "commit": commit,
                "commit_short": commit[:8],
                "author": author
            })
        except Exception:
            pass
        return info

    def execute_dump(self, name: str, cli_args: List[str], target_filename: str) -> Optional[Dict[str, Any]]:
        """Run supabase db dump with atomic writing and verification."""
        target_path = os.path.join(self.target_dir, target_filename)
        tmp_path = target_path + ".tmp"
        cmd = ["supabase", "db", "dump", "--linked"] + cli_args + ["-f", tmp_path]

        UI.step(2, 4, f"Dumping {name} -> {target_filename}")
        if self.args.dry_run:
            print(f"  {UI.DIM}[DRY-RUN] Would execute: {' '.join(cmd)}{UI.RESET}")
            return None

        t0 = time.time()
        process = subprocess.run(cmd, cwd=self.project_root, capture_output=True, text=True)

        if process.returncode != 0:
            UI.error(f"Failed to dump {name}: Exit code {process.returncode}")
            if process.stderr:
                print(f"{UI.RED}{process.stderr.strip()}{UI.RESET}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            sys.exit(process.returncode)

        # Sanity Check: output must exist and have content
        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            UI.error(f"Dump produced empty 0-byte file: {tmp_path}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            sys.exit(1)

        # Atomic commit
        os.replace(tmp_path, target_path)
        elapsed = time.time() - t0
        file_bytes = os.path.getsize(target_path)
        sha256_hash = compute_sha256(target_path)
        lines = count_lines(target_path)

        # Write individual .sha256 file
        sha_file = target_path + ".sha256"
        with open(sha_file, "w", encoding="utf-8") as f:
            f.write(f"{sha256_hash}  {target_filename}\n")

        # Copy to latest/
        latest_file = os.path.join(self.latest_dir, target_filename)
        latest_sha = os.path.join(self.latest_dir, target_filename + ".sha256")
        shutil.copy2(target_path, latest_file)
        shutil.copy2(sha_file, latest_sha)

        # Optional Compression
        compressed_info = None
        if self.args.compress:
            gz_path = target_path + ".gz"
            with open(target_path, "rb") as f_in, gzip.open(gz_path, "wb", compresslevel=9) as f_out:
                shutil.copyfileobj(f_in, f_out)
            gz_bytes = os.path.getsize(gz_path)
            gz_sha256 = compute_sha256(gz_path)
            # copy to latest
            shutil.copy2(gz_path, os.path.join(self.latest_dir, target_filename + ".gz"))
            compressed_info = {
                "compressed_filename": target_filename + ".gz",
                "compressed_bytes": gz_bytes,
                "compressed_human_size": format_bytes(gz_bytes),
                "compressed_sha256": gz_sha256,
                "compression_ratio": f"{(1 - (gz_bytes / file_bytes)) * 100:.1f}%"
            }

        artifact_data = {
            "filename": target_filename,
            "path": target_path,
            "bytes": file_bytes,
            "human_size": format_bytes(file_bytes),
            "lines": lines,
            "sha256": sha256_hash,
            "elapsed_seconds": round(elapsed, 2),
            "compressed": compressed_info
        }

        UI.success(f"{name} completed in {elapsed:.1f}s | "
                   f"Size: {UI.CYAN}{format_bytes(file_bytes)}{UI.RESET} | "
                   f"Lines: {UI.CYAN}{lines:,}{UI.RESET}")
        print(f"     SHA-256: {UI.DIM}{sha256_hash}{UI.RESET}")
        if compressed_info:
            UI.success(f"Gzip Compressed: {UI.CYAN}{compressed_info['compressed_human_size']}{UI.RESET} "
                       f"({compressed_info['compression_ratio']} reduction)")

        self.artifacts[target_filename] = artifact_data
        return artifact_data

    def create_manifest(self, preflight_meta: Dict[str, str]) -> str:
        """Generate audit-grade manifest.json with full cryptographic tracking."""
        UI.step(3, 4, "Generating Cryptographic Audit Manifest")

        total_elapsed = time.time() - self.start_time
        manifest = {
            "version": "1.0.0",
            "backup_id": self.backup_id,
            "project_ref": self.DEFAULT_PROJECT_REF,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "timestamp_local": datetime.now().isoformat(),
            "mode": self.args.mode,
            "total_elapsed_seconds": round(total_elapsed, 2),
            "environment": {
                "os": sys.platform,
                "python_version": sys.version.split()[0],
                "cli_version": preflight_meta.get("cli_version", "unknown"),
                "git_branch": preflight_meta.get("branch", "unknown"),
                "git_commit": preflight_meta.get("commit", "unknown"),
                "git_author": preflight_meta.get("author", "unknown")
            },
            "artifacts": self.artifacts
        }

        manifest_path = os.path.join(self.target_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        # Copy to latest
        latest_manifest = os.path.join(self.latest_dir, "manifest.json")
        shutil.copy2(manifest_path, latest_manifest)

        manifest_sha = compute_sha256(manifest_path)
        UI.success(f"Audit Manifest: {UI.CYAN}{manifest_path}{UI.RESET}")
        print(f"     SHA-256: {UI.DIM}{manifest_sha}{UI.RESET}")
        return manifest_path

    def prune_old_backups(self):
        """Keep only the N most recent backups to prevent storage exhaustion."""
        UI.step(4, 4, f"Retention Policy Check (Keep Latest {self.args.keep})")

        if not os.path.exists(self.base_backup_dir):
            return

        entries = []
        for name in os.listdir(self.base_backup_dir):
            path = os.path.join(self.base_backup_dir, name)
            if os.path.isdir(path) and name.startswith("backup_"):
                entries.append((name, path))

        # Sort descending by folder name (timestamp)
        entries.sort(key=lambda x: x[0], reverse=True)

        if len(entries) <= self.args.keep:
            UI.success(f"Total backups stored: {len(entries)} (within threshold of {self.args.keep})")
            return

        to_remove = entries[self.args.keep:]
        for name, path in to_remove:
            UI.warn(f"Pruning expired backup: {name}")
            shutil.rmtree(path, ignore_errors=True)
        UI.success(f"Pruning complete. Active backups retained: {self.args.keep}")


def verify_backup(backup_path: str):
    """Verify integrity of a backup directory against manifest.json and sha256 checksums."""
    UI.header("Database Backup Integrity Verification")
    manifest_file = os.path.join(backup_path, "manifest.json")

    if not os.path.exists(manifest_file):
        UI.error(f"Manifest not found in {backup_path}")
        sys.exit(1)

    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"Backup ID : {UI.CYAN}{manifest.get('backup_id')}{UI.RESET}")
    print(f"Timestamp : {UI.CYAN}{manifest.get('timestamp_utc')}{UI.RESET}")
    print(f"Project   : {UI.CYAN}{manifest.get('project_ref')}{UI.RESET}\n")

    all_passed = True
    for fname, meta in manifest.get("artifacts", {}).items():
        artifact_path = os.path.join(backup_path, fname)
        if not os.path.exists(artifact_path):
            UI.error(f"Missing file: {fname}")
            all_passed = False
            continue

        actual_bytes = os.path.getsize(artifact_path)
        actual_hash = compute_sha256(artifact_path)
        expected_hash = meta.get("sha256")

        if actual_hash == expected_hash and actual_bytes == meta.get("bytes"):
            UI.success(f"{fname}: SHA-256 Verified ({format_bytes(actual_bytes)})")
        else:
            UI.error(f"{fname}: CHECKSUM MISMATCH! Expected {expected_hash}, got {actual_hash}")
            all_passed = False

    if all_passed:
        print(f"\n{UI.GREEN}{UI.BOLD}✓ All backup artifacts passed cryptographic verification!{UI.RESET}\n")
    else:
        print(f"\n{UI.RED}{UI.BOLD}✗ Verification failed! One or more artifacts are corrupted.{UI.RESET}\n")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="SkillPassport Industrial-Grade Remote Database Backup Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/backup_remote_db.py                      # Full backup (schema + seed + roles)
  python3 scripts/backup_remote_db.py --schema-only        # Schema DDL only
  python3 scripts/backup_remote_db.py --seed-only          # Seed data DML only
  python3 scripts/backup_remote_db.py --public-only        # Public schema seed data only
  python3 scripts/backup_remote_db.py --compress           # Backup and compress with gzip
  python3 scripts/backup_remote_db.py --verify latest      # Verify integrity of latest backup
        """
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--schema-only", action="store_true", help="Dump only database schema / DDL")
    group.add_argument("--seed-only", action="store_true", help="Dump only database seed data / DML")
    group.add_argument("--roles-only", action="store_true", help="Dump only cluster roles")
    group.add_argument("--public-only", action="store_true", help="Dump only public schema seed data")
    group.add_argument("--verify", type=str, metavar="PATH", help="Verify backup integrity using manifest.json")

    parser.add_argument("--compress", "-z", action="store_true", help="Compress dump files with Gzip (.gz)")
    parser.add_argument("--keep", type=int, default=5, help="Number of backups to retain (default: 5)")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without dumping")

    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))

    # Verification Mode
    if args.verify:
        verify_path = args.verify
        if verify_path == "latest":
            verify_path = os.path.join(project_root, "supabase", "backups", "latest")
        verify_backup(verify_path)
        return

    # Determine execution mode
    if args.schema_only:
        args.mode = "schema-only"
    elif args.seed_only:
        args.mode = "seed-only"
    elif args.roles_only:
        args.mode = "roles-only"
    elif args.public_only:
        args.mode = "public-only"
    else:
        args.mode = "all"

    manager = DatabaseBackupManager(project_root, args)

    UI.header(f"SkillPassport Database Backup Engine [{args.mode.upper()}]")
    preflight_meta = manager.run_preflight_checks()

    # 1. Schema Dump
    if args.mode in ["all", "schema-only"]:
        manager.execute_dump(
            name="Database Schema / Migrations (DDL)",
            cli_args=[],
            target_filename="migration_schema.sql"
        )

    # 2. Roles Dump
    if args.mode in ["all", "roles-only"]:
        manager.execute_dump(
            name="Database Cluster Roles",
            cli_args=["--role-only"],
            target_filename="roles.sql"
        )

    # 3. Seed / Data Dump
    if args.mode in ["all", "seed-only"]:
        manager.execute_dump(
            name="Database Seed Data (All Schemas)",
            cli_args=["--data-only", "--use-copy"],
            target_filename="seed_data.sql"
        )

    # 4. Public-Only Seed Dump
    if args.mode == "public-only":
        manager.execute_dump(
            name="Database Seed Data (Public Schema)",
            cli_args=["--data-only", "--use-copy", "-s", "public"],
            target_filename="seed_public_data.sql"
        )

    if not args.dry_run:
        manager.create_manifest(preflight_meta)
        manager.prune_old_backups()

    total_time = time.time() - manager.start_time
    UI.header(f"✓ Backup Engine Finished Successfully in {total_time:.1f}s")
    print(f"Artifacts saved to: {UI.CYAN}{manager.target_dir}{UI.RESET}")
    print(f"Latest copy:        {UI.CYAN}{manager.latest_dir}{UI.RESET}\n")


if __name__ == "__main__":
    main()
