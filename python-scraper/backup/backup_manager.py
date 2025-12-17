"""
Automated Database Backup Manager
Basketball Shooting Analysis System

Features:
- Full database backups
- Incremental backups
- S3 storage
- Automatic retention/cleanup
- Compression
- Notifications
"""

import os
import sys
import gzip
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from urllib.parse import urlparse

sys.path.append(str(Path(__file__).parent.parent))

import boto3
from botocore.exceptions import ClientError
from loguru import logger

from backup.backup_config import (
    BACKUP_BUCKET,
    BACKUP_PREFIX,
    LOCAL_BACKUP_DIR,
    TABLES_TO_BACKUP,
    CRITICAL_TABLES,
    BACKUP_FILENAME_FORMAT,
    ARCHIVE_FILENAME_FORMAT,
    COMPRESSION_ENABLED,
    COMPRESSION_LEVEL,
    RETENTION_POLICIES,
    DATABASE_URL,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    NOTIFY_ON_FAILURE,
    NOTIFICATION_WEBHOOK,
)


class BackupManager:
    """
    Manages database backups with S3 storage
    """
    
    def __init__(self):
        self.local_backup_dir = Path(LOCAL_BACKUP_DIR)
        self.local_backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Parse database URL
        self.db_config = self._parse_database_url(DATABASE_URL)
        
        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        logger.info("BackupManager initialized")
    
    def _parse_database_url(self, url: str) -> Dict:
        """
        Parse PostgreSQL connection URL
        """
        if not url:
            raise ValueError("DATABASE_URL not set")
        
        parsed = urlparse(url)
        return {
            "host": parsed.hostname,
            "port": parsed.port or 5432,
            "user": parsed.username,
            "password": parsed.password,
            "database": parsed.path.lstrip("/"),
        }
    
    def _get_timestamp(self) -> str:
        """Get formatted timestamp for filenames"""
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def _run_pg_dump(
        self,
        output_file: Path,
        table: Optional[str] = None,
        schema_only: bool = False,
        data_only: bool = False,
    ) -> bool:
        """
        Run pg_dump to create backup
        """
        env = os.environ.copy()
        env["PGPASSWORD"] = self.db_config["password"]
        
        cmd = [
            "pg_dump",
            "-h", self.db_config["host"],
            "-p", str(self.db_config["port"]),
            "-U", self.db_config["user"],
            "-d", self.db_config["database"],
            "-f", str(output_file),
            "--format=plain",  # SQL format
            "--no-owner",
            "--no-privileges",
        ]
        
        if table:
            cmd.extend(["-t", table])
        
        if schema_only:
            cmd.append("--schema-only")
        elif data_only:
            cmd.append("--data-only")
        
        try:
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"pg_dump failed: {result.stderr}")
                return False
            
            logger.info(f"pg_dump successful: {output_file}")
            return True
            
        except subprocess.TimeoutExpired:
            logger.error("pg_dump timed out")
            return False
        except Exception as e:
            logger.error(f"pg_dump error: {e}")
            return False
    
    def _compress_file(self, filepath: Path) -> Optional[Path]:
        """
        Compress a file using gzip
        """
        if not COMPRESSION_ENABLED:
            return filepath
        
        compressed_path = filepath.with_suffix(filepath.suffix + ".gz")
        
        try:
            with open(filepath, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb', compresslevel=COMPRESSION_LEVEL) as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove original
            filepath.unlink()
            
            logger.info(f"Compressed: {compressed_path}")
            return compressed_path
            
        except Exception as e:
            logger.error(f"Compression failed: {e}")
            return filepath
    
    def _upload_to_s3(self, local_path: Path, s3_key: str) -> bool:
        """
        Upload backup file to S3
        """
        try:
            extra_args = {
                'ContentType': 'application/gzip' if str(local_path).endswith('.gz') else 'application/sql',
                'ServerSideEncryption': 'AES256',
            }
            
            self.s3_client.upload_file(
                str(local_path),
                BACKUP_BUCKET,
                s3_key,
                ExtraArgs=extra_args
            )
            
            logger.info(f"Uploaded to S3: s3://{BACKUP_BUCKET}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            return False
    
    def _cleanup_local(self, filepath: Path):
        """Remove local backup file after upload"""
        try:
            if filepath.exists():
                filepath.unlink()
                logger.debug(f"Cleaned up local file: {filepath}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {filepath}: {e}")
    
    def backup_full(self) -> Dict:
        """
        Create full database backup
        
        Returns:
            Dict with backup status and details
        """
        logger.info("=" * 50)
        logger.info("Starting FULL database backup")
        logger.info("=" * 50)
        
        timestamp = self._get_timestamp()
        results = {
            "type": "full",
            "timestamp": timestamp,
            "success": False,
            "files": [],
            "errors": [],
        }
        
        # 1. Backup schema
        schema_file = self.local_backup_dir / f"schema_{timestamp}.sql"
        if self._run_pg_dump(schema_file, schema_only=True):
            compressed = self._compress_file(schema_file)
            s3_key = f"{BACKUP_PREFIX}full/{timestamp}/schema.sql.gz"
            if self._upload_to_s3(compressed, s3_key):
                results["files"].append(s3_key)
                self._cleanup_local(compressed)
            else:
                results["errors"].append("Failed to upload schema")
        
        # 2. Backup each table
        for table in TABLES_TO_BACKUP:
            logger.info(f"Backing up table: {table}")
            
            table_file = self.local_backup_dir / f"{table}_{timestamp}.sql"
            if self._run_pg_dump(table_file, table=table, data_only=True):
                compressed = self._compress_file(table_file)
                s3_key = f"{BACKUP_PREFIX}full/{timestamp}/{table}.sql.gz"
                if self._upload_to_s3(compressed, s3_key):
                    results["files"].append(s3_key)
                    self._cleanup_local(compressed)
                else:
                    results["errors"].append(f"Failed to upload {table}")
            else:
                results["errors"].append(f"Failed to backup {table}")
        
        results["success"] = len(results["errors"]) == 0
        
        logger.info(f"Full backup complete: {len(results['files'])} files, {len(results['errors'])} errors")
        
        return results
    
    def backup_table(self, table: str) -> Dict:
        """
        Backup a single table
        """
        timestamp = self._get_timestamp()
        results = {
            "type": "single_table",
            "table": table,
            "timestamp": timestamp,
            "success": False,
            "s3_key": None,
        }
        
        table_file = self.local_backup_dir / f"{table}_{timestamp}.sql"
        
        if self._run_pg_dump(table_file, table=table):
            compressed = self._compress_file(table_file)
            s3_key = f"{BACKUP_PREFIX}tables/{table}/{timestamp}.sql.gz"
            
            if self._upload_to_s3(compressed, s3_key):
                results["success"] = True
                results["s3_key"] = s3_key
                self._cleanup_local(compressed)
        
        return results
    
    def backup_critical_tables(self) -> Dict:
        """
        Backup only critical tables (shooters, images)
        """
        logger.info("Backing up critical tables only")
        
        timestamp = self._get_timestamp()
        results = {
            "type": "critical",
            "timestamp": timestamp,
            "success": False,
            "files": [],
            "errors": [],
        }
        
        for table in CRITICAL_TABLES:
            table_file = self.local_backup_dir / f"{table}_{timestamp}.sql"
            
            if self._run_pg_dump(table_file, table=table):
                compressed = self._compress_file(table_file)
                s3_key = f"{BACKUP_PREFIX}critical/{timestamp}/{table}.sql.gz"
                
                if self._upload_to_s3(compressed, s3_key):
                    results["files"].append(s3_key)
                    self._cleanup_local(compressed)
                else:
                    results["errors"].append(f"Failed to upload {table}")
            else:
                results["errors"].append(f"Failed to backup {table}")
        
        results["success"] = len(results["errors"]) == 0
        return results
    
    def list_backups(self, backup_type: str = "full") -> List[Dict]:
        """
        List available backups in S3
        """
        try:
            prefix = f"{BACKUP_PREFIX}{backup_type}/"
            
            response = self.s3_client.list_objects_v2(
                Bucket=BACKUP_BUCKET,
                Prefix=prefix
            )
            
            backups = []
            for obj in response.get('Contents', []):
                backups.append({
                    "key": obj['Key'],
                    "size": obj['Size'],
                    "last_modified": obj['LastModified'].isoformat(),
                })
            
            return sorted(backups, key=lambda x: x['last_modified'], reverse=True)
            
        except ClientError as e:
            logger.error(f"Failed to list backups: {e}")
            return []
    
    def cleanup_old_backups(self, retention_days: int = 30) -> int:
        """
        Remove backups older than retention period
        """
        logger.info(f"Cleaning up backups older than {retention_days} days")
        
        cutoff = datetime.now() - timedelta(days=retention_days)
        deleted = 0
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=BACKUP_BUCKET,
                Prefix=BACKUP_PREFIX
            )
            
            for obj in response.get('Contents', []):
                if obj['LastModified'].replace(tzinfo=None) < cutoff:
                    self.s3_client.delete_object(
                        Bucket=BACKUP_BUCKET,
                        Key=obj['Key']
                    )
                    deleted += 1
                    logger.debug(f"Deleted: {obj['Key']}")
            
            logger.info(f"Cleaned up {deleted} old backup files")
            return deleted
            
        except ClientError as e:
            logger.error(f"Cleanup failed: {e}")
            return 0
    
    def restore_backup(
        self,
        backup_key: str,
        target_table: Optional[str] = None
    ) -> bool:
        """
        Restore from S3 backup
        """
        logger.info(f"Restoring from: {backup_key}")
        
        # Download from S3
        local_file = self.local_backup_dir / "restore_temp.sql.gz"
        
        try:
            self.s3_client.download_file(
                BACKUP_BUCKET,
                backup_key,
                str(local_file)
            )
        except ClientError as e:
            logger.error(f"Failed to download backup: {e}")
            return False
        
        # Decompress
        sql_file = local_file.with_suffix('')
        try:
            with gzip.open(local_file, 'rb') as f_in:
                with open(sql_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            local_file.unlink()
        except Exception as e:
            logger.error(f"Failed to decompress: {e}")
            return False
        
        # Run psql to restore
        env = os.environ.copy()
        env["PGPASSWORD"] = self.db_config["password"]
        
        cmd = [
            "psql",
            "-h", self.db_config["host"],
            "-p", str(self.db_config["port"]),
            "-U", self.db_config["user"],
            "-d", self.db_config["database"],
            "-f", str(sql_file),
        ]
        
        try:
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode != 0:
                logger.error(f"Restore failed: {result.stderr}")
                return False
            
            logger.info("Restore successful")
            return True
            
        except Exception as e:
            logger.error(f"Restore error: {e}")
            return False
        finally:
            sql_file.unlink(missing_ok=True)
    
    def verify_backup(self, backup_key: str) -> Dict:
        """
        Verify backup integrity - basic S3 check
        """
        try:
            response = self.s3_client.head_object(
                Bucket=BACKUP_BUCKET,
                Key=backup_key
            )
            
            return {
                "exists": True,
                "size": response['ContentLength'],
                "last_modified": response['LastModified'].isoformat(),
                "etag": response['ETag'],
            }
            
        except ClientError:
            return {"exists": False}


def run_scheduled_backup(backup_type: str = "full") -> Dict:
    """
    Entry point for scheduled backups
    """
    manager = BackupManager()
    
    if backup_type == "full":
        result = manager.backup_full()
    elif backup_type == "critical":
        result = manager.backup_critical_tables()
    else:
        result = {"success": False, "error": f"Unknown backup type: {backup_type}"}
    
    # Cleanup old backups
    if result.get("success"):
        manager.cleanup_old_backups(retention_days=30)
    
    return result


# ==========================================
# BACKUP VERIFICATION FUNCTION
# ==========================================

def verify_backup(backup_file: str) -> Dict:
    """
    Verify backup integrity
    
    Steps:
    1. Download backup from S3
    2. Test restore to temporary database
    3. Check row counts match original
    4. Verify no corruption
    
    Args:
        backup_file: S3 key of the backup to verify
        
    Returns:
        Dict with verification results
    """
    from urllib.parse import urlparse
    
    logger.info(f"Verifying backup: {backup_file}")
    
    results = {
        "backup_file": backup_file,
        "verified": False,
        "checks": {},
        "errors": [],
    }
    
    # Parse database URL
    parsed = urlparse(DATABASE_URL)
    original_db = parsed.path.lstrip('/')
    temp_db = f"{original_db}_verify_temp"
    
    env = os.environ.copy()
    env["PGPASSWORD"] = parsed.password or ""
    
    local_backup = Path(LOCAL_BACKUP_DIR) / "verify_temp.sql"
    local_backup.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # ==========================================
        # STEP 1: Download backup from S3
        # ==========================================
        logger.info("Step 1: Downloading backup from S3...")
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        # Handle both .sql and .sql.gz files
        if backup_file.endswith('.gz'):
            compressed_path = local_backup.with_suffix('.sql.gz')
            s3_client.download_file(BACKUP_BUCKET, backup_file, str(compressed_path))
            
            # Decompress
            with gzip.open(compressed_path, 'rb') as f_in:
                with open(local_backup, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            compressed_path.unlink()
        else:
            s3_client.download_file(BACKUP_BUCKET, backup_file, str(local_backup))
        
        results["checks"]["download"] = "PASSED"
        logger.info("✅ Download complete")
        
        # ==========================================
        # STEP 2: Verify file is valid SQL
        # ==========================================
        logger.info("Step 2: Checking file integrity...")
        
        file_size = local_backup.stat().st_size
        if file_size == 0:
            results["errors"].append("Backup file is empty")
            results["checks"]["file_integrity"] = "FAILED"
            return results
        
        # Check for SQL content
        with open(local_backup, 'r', errors='ignore') as f:
            first_lines = f.read(1000)
            if not any(keyword in first_lines.upper() for keyword in ['CREATE', 'INSERT', 'COPY', 'SET', '--']):
                results["errors"].append("File does not appear to be valid SQL")
                results["checks"]["file_integrity"] = "FAILED"
                return results
        
        results["checks"]["file_integrity"] = "PASSED"
        results["checks"]["file_size"] = file_size
        logger.info(f"✅ File integrity OK ({file_size} bytes)")
        
        # ==========================================
        # STEP 3: Get row counts from original database
        # ==========================================
        logger.info("Step 3: Getting original row counts...")
        
        original_counts = {}
        for table in TABLES_TO_BACKUP:
            try:
                count_cmd = [
                    'psql',
                    '-U', parsed.username or 'postgres',
                    '-h', parsed.hostname or 'localhost',
                    '-p', str(parsed.port or 5432),
                    '-d', original_db,
                    '-t', '-c', f'SELECT COUNT(*) FROM {table};'
                ]
                result = subprocess.run(count_cmd, env=env, capture_output=True, text=True)
                if result.returncode == 0:
                    original_counts[table] = int(result.stdout.strip())
            except:
                pass
        
        results["checks"]["original_counts"] = original_counts
        logger.info(f"✅ Original counts: {original_counts}")
        
        # ==========================================
        # STEP 4: Create temporary database
        # ==========================================
        logger.info("Step 4: Creating temporary database...")
        
        # Drop temp db if exists
        drop_cmd = [
            'psql',
            '-U', parsed.username or 'postgres',
            '-h', parsed.hostname or 'localhost',
            '-p', str(parsed.port or 5432),
            '-d', 'postgres',
            '-c', f'DROP DATABASE IF EXISTS {temp_db};'
        ]
        subprocess.run(drop_cmd, env=env, capture_output=True)
        
        # Create temp db
        create_cmd = [
            'psql',
            '-U', parsed.username or 'postgres',
            '-h', parsed.hostname or 'localhost',
            '-p', str(parsed.port or 5432),
            '-d', 'postgres',
            '-c', f'CREATE DATABASE {temp_db};'
        ]
        result = subprocess.run(create_cmd, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            results["errors"].append(f"Failed to create temp database: {result.stderr}")
            results["checks"]["temp_db_create"] = "FAILED"
            return results
        
        results["checks"]["temp_db_create"] = "PASSED"
        logger.info("✅ Temporary database created")
        
        # ==========================================
        # STEP 5: Restore backup to temporary database
        # ==========================================
        logger.info("Step 5: Restoring backup to temp database...")
        
        restore_cmd = [
            'psql',
            '-U', parsed.username or 'postgres',
            '-h', parsed.hostname or 'localhost',
            '-p', str(parsed.port or 5432),
            '-d', temp_db,
            '-f', str(local_backup)
        ]
        result = subprocess.run(restore_cmd, env=env, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            # Some errors are OK (like "relation already exists")
            if "ERROR" in result.stderr and "already exists" not in result.stderr:
                results["errors"].append(f"Restore errors: {result.stderr[:500]}")
                results["checks"]["restore"] = "PARTIAL"
            else:
                results["checks"]["restore"] = "PASSED"
        else:
            results["checks"]["restore"] = "PASSED"
        
        logger.info("✅ Backup restored to temp database")
        
        # ==========================================
        # STEP 6: Check row counts match
        # ==========================================
        logger.info("Step 6: Verifying row counts...")
        
        restored_counts = {}
        count_mismatches = []
        
        for table in TABLES_TO_BACKUP:
            try:
                count_cmd = [
                    'psql',
                    '-U', parsed.username or 'postgres',
                    '-h', parsed.hostname or 'localhost',
                    '-p', str(parsed.port or 5432),
                    '-d', temp_db,
                    '-t', '-c', f'SELECT COUNT(*) FROM {table};'
                ]
                result = subprocess.run(count_cmd, env=env, capture_output=True, text=True)
                if result.returncode == 0:
                    restored_counts[table] = int(result.stdout.strip())
                    
                    # Compare with original
                    if table in original_counts:
                        if restored_counts[table] != original_counts[table]:
                            count_mismatches.append({
                                "table": table,
                                "original": original_counts[table],
                                "restored": restored_counts[table]
                            })
            except:
                pass
        
        results["checks"]["restored_counts"] = restored_counts
        
        if count_mismatches:
            results["checks"]["row_count_match"] = "FAILED"
            results["errors"].append(f"Row count mismatches: {count_mismatches}")
        else:
            results["checks"]["row_count_match"] = "PASSED"
            logger.info("✅ Row counts match")
        
        # ==========================================
        # STEP 7: Verify no corruption (sample data check)
        # ==========================================
        logger.info("Step 7: Checking for corruption...")
        
        # Try to query each table
        corruption_found = False
        for table in TABLES_TO_BACKUP:
            try:
                check_cmd = [
                    'psql',
                    '-U', parsed.username or 'postgres',
                    '-h', parsed.hostname or 'localhost',
                    '-p', str(parsed.port or 5432),
                    '-d', temp_db,
                    '-t', '-c', f'SELECT * FROM {table} LIMIT 5;'
                ]
                result = subprocess.run(check_cmd, env=env, capture_output=True, text=True)
                if result.returncode != 0:
                    corruption_found = True
                    results["errors"].append(f"Cannot query {table}: {result.stderr}")
            except Exception as e:
                corruption_found = True
                results["errors"].append(f"Error checking {table}: {e}")
        
        if corruption_found:
            results["checks"]["corruption_check"] = "FAILED"
        else:
            results["checks"]["corruption_check"] = "PASSED"
            logger.info("✅ No corruption detected")
        
        # ==========================================
        # FINAL RESULT
        # ==========================================
        all_passed = all(
            v == "PASSED" for k, v in results["checks"].items() 
            if isinstance(v, str) and k not in ["restore"]  # restore can be PARTIAL
        )
        
        results["verified"] = all_passed and len(results["errors"]) == 0
        
        if results["verified"]:
            logger.info("✅ BACKUP VERIFICATION PASSED")
        else:
            logger.warning(f"⚠️ BACKUP VERIFICATION FAILED: {results['errors']}")
        
        return results
        
    except Exception as e:
        logger.error(f"Verification error: {e}")
        results["errors"].append(str(e))
        return results
        
    finally:
        # ==========================================
        # CLEANUP: Drop temporary database
        # ==========================================
        logger.info("Cleaning up temporary database...")
        try:
            drop_cmd = [
                'psql',
                '-U', parsed.username or 'postgres',
                '-h', parsed.hostname or 'localhost',
                '-p', str(parsed.port or 5432),
                '-d', 'postgres',
                '-c', f'DROP DATABASE IF EXISTS {temp_db};'
            ]
            subprocess.run(drop_cmd, env=env, capture_output=True)
            logger.info("✅ Temporary database cleaned up")
        except:
            pass
        
        # Remove local file
        local_backup.unlink(missing_ok=True)


# ==========================================
# SIMPLE BACKUP FUNCTION (User's approach)
# ==========================================

def backup_database():
    """
    Create daily backup of PostgreSQL database
    Simple approach - single file backup to S3
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"basketball_shooting_db_backup_{timestamp}.sql"
    local_path = Path(LOCAL_BACKUP_DIR) / backup_file
    
    # Ensure backup directory exists
    local_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Parse database URL for connection details
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    
    # Set password in environment
    env = os.environ.copy()
    env["PGPASSWORD"] = parsed.password or ""
    
    command = [
        'pg_dump',
        '-U', parsed.username or 'postgres',
        '-h', parsed.hostname or 'localhost',
        '-p', str(parsed.port or 5432),
        '-d', parsed.path.lstrip('/') or 'basketball_shooting_db',
        '-f', str(local_path)
    ]
    
    try:
        result = subprocess.run(command, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"pg_dump failed: {result.stderr}")
            return {"success": False, "error": result.stderr}
        
        logger.info(f"Database dump created: {local_path}")
        
        # Upload to S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        s3_key = f"daily/{backup_file}"
        s3_client.upload_file(
            str(local_path),
            BACKUP_BUCKET,
            s3_key,
            ExtraArgs={'ServerSideEncryption': 'AES256'}
        )
        
        logger.info(f"Backup uploaded to S3: s3://{BACKUP_BUCKET}/{s3_key}")
        
        # Clean up local file
        local_path.unlink(missing_ok=True)
        
        print(f"Backup completed: {backup_file}")
        
        return {
            "success": True,
            "backup_file": backup_file,
            "s3_path": f"s3://{BACKUP_BUCKET}/{s3_key}",
            "timestamp": timestamp
        }
        
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    logger.add("backup.log", rotation="10 MB")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        manager = BackupManager()
        
        if command == "full":
            result = manager.backup_full()
            print(f"Backup {'successful' if result['success'] else 'failed'}")
            print(f"Files: {len(result['files'])}")
            
        elif command == "critical":
            result = manager.backup_critical_tables()
            print(f"Critical backup {'successful' if result['success'] else 'failed'}")
            
        elif command == "list":
            backups = manager.list_backups()
            print(f"\nFound {len(backups)} backups:\n")
            for b in backups[:20]:
                print(f"  {b['key']} ({b['size']} bytes)")
                
        elif command == "cleanup":
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            deleted = manager.cleanup_old_backups(days)
            print(f"Deleted {deleted} old backups")
            
        elif command == "restore":
            if len(sys.argv) > 2:
                success = manager.restore_backup(sys.argv[2])
                print(f"Restore {'successful' if success else 'failed'}")
            else:
                print("Usage: python backup_manager.py restore <s3_key>")
                
        else:
            print("Usage: python backup_manager.py [full|critical|list|cleanup|restore]")
    else:
        # Default: run full backup
        result = run_scheduled_backup("full")
        print(f"Backup complete: {result}")







