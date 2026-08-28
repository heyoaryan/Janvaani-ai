const { execFileSync } = require('node:child_process');

const port = process.argv[2] || process.env.PORT || '5001';

try {
  const output = execFileSync('lsof', ['-tiTCP:' + port, '-sTCP:LISTEN'], { encoding: 'utf8' }).trim();
  const pids = output.split(/\s+/).filter(Boolean);

  if (pids.length > 0) {
    process.stdout.write(`Stopping existing process on port ${port}: ${pids.join(', ')}\n`);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  }
} catch (error) {
  if (error.status !== 1) throw error;
}
