const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(' Starting DeepFake Detection System...\n');

// Create necessary directories
const createDirectories = () => {
  console.log(' Creating necessary directories...');
  const dirs = [
    path.join(__dirname, 'backend', 'uploads'),
    path.join(__dirname, 'backend', 'reports'),
    'C:\\data\\db'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  });
  console.log(' Directories ready!\n');
};

// Check if dependencies are installed
const checkDeps = () => {
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');

  return fs.existsSync(backendNodeModules) && fs.existsSync(frontendNodeModules);
};

// Install dependencies if not found
const installDeps = () => {
  console.log(' Installing dependencies...\n');

  // Install backend dependencies
  console.log('Installing backend dependencies...');
  const backendInstall = spawn('npm.cmd', ['install'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });

  backendInstall.on('close', (code) => {
    if (code !== 0) {
      console.error(' Failed to install backend dependencies');
      process.exit(1);
    }

    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    const frontendInstall = spawn('npm.cmd', ['install'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit'
    });

    frontendInstall.on('close', (code) => {
      if (code !== 0) {
        console.error(' Failed to install frontend dependencies');
        process.exit(1);
      }

      // Install inference dependencies
      console.log('Installing inference dependencies...');
      const inferenceInstall = spawn('pip', ['install', '-r', 'requirements.txt'], {
        cwd: path.join(__dirname, 'inference'),
        stdio: 'inherit'
      });

      inferenceInstall.on('close', (code) => {
        if (code !== 0) {
          console.error(' Failed to install inference dependencies');
          process.exit(1);
        }

        console.log(' Dependencies installed successfully!\n');
        createDirectories();
        startServices();
      });
    });
  });
};

if (!checkDeps()) {
  installDeps();
} else {
  createDirectories();
  startServices();
}

function startServices() {
  // Check if MongoDB is already running
  console.log(' Checking MongoDB...');
  const mongoCheck = spawn('netstat', ['-ano'], {
    stdio: 'pipe'
  });

  let mongoRunning = false;
  mongoCheck.stdout.on('data', (data) => {
    if (data.toString().includes(':27017')) {
      mongoRunning = true;
    }
  });

  mongoCheck.on('close', () => {
    if (!mongoRunning) {
      console.log(' Starting MongoDB...');
      const mongoProcess = spawn('mongod', ['--dbpath', 'C:\\data\\db'], {
        stdio: 'inherit'
      });
    } else {
      console.log(' MongoDB already running');
    }
  });

  // Wait for MongoDB to start
  setTimeout(() => {
    // Start Backend
    console.log('🔧 Starting Backend...');
    const backendProcess = spawn('cmd.exe', ['/c', 'npm start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });

    // Start Inference
    console.log(' Starting Inference Service...');
    const inferenceProcess = spawn('cmd.exe', ['/c', 'python -m uvicorn main:app --host 127.0.0.1 --port 8000'], {
      cwd: path.join(__dirname, 'inference'),
      stdio: 'inherit'
    });

    // Start Frontend
    console.log(' Starting Frontend...');
    const frontendProcess = spawn('cmd.exe', ['/c', 'npm start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit'
    });

    console.log('\n All services started!');
    console.log(' Access the application at: http://localhost:3000');
    console.log(' Press Ctrl+C to stop all services\n');

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n Stopping all services...');
      try {
        mongoProcess.kill();
        backendProcess.kill();
        inferenceProcess.kill();
        frontendProcess.kill();
      } catch (e) {
        // Ignore errors when killing processes
      }
      process.exit(0);
    });

  }, 3000);
}
