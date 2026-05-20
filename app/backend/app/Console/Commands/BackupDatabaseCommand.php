<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'app:backup-database';

    protected $description = 'Create a local database backup dump';

    public function handle(): int
    {
        $connection = config('database.default');
        $timestamp = now()->format('Y_m_d_His');

        if ($connection === 'sqlite') {
            $sqlitePath = config('database.connections.sqlite.database');
            if (! is_string($sqlitePath) || ! file_exists($sqlitePath)) {
                $this->error('SQLite database file not found.');

                return self::FAILURE;
            }

            Storage::disk('local')->put("backups/database_{$timestamp}.sqlite", file_get_contents($sqlitePath));
            $this->info('SQLite backup created successfully.');

            return self::SUCCESS;
        }

        if ($connection !== 'pgsql') {
            $this->error('Database backup currently supports sqlite and pgsql connections.');

            return self::FAILURE;
        }

        $database = (string) config('database.connections.pgsql.database');
        $username = (string) config('database.connections.pgsql.username');
        $host = (string) config('database.connections.pgsql.host');
        $port = (string) config('database.connections.pgsql.port');
        $password = (string) config('database.connections.pgsql.password');

        $outputPath = storage_path("app/backups/database_{$timestamp}.sql");
        if (! is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        $command = [
            'pg_dump',
            '--format=plain',
            '--no-owner',
            '--no-privileges',
            "--host={$host}",
            "--port={$port}",
            "--username={$username}",
            $database,
        ];

        $process = new Process($command);
        $process->setEnv(['PGPASSWORD' => $password]);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Database backup failed.');

            return self::FAILURE;
        }

        file_put_contents($outputPath, $process->getOutput());
        $this->info('PostgreSQL backup created successfully.');

        return self::SUCCESS;
    }
}
