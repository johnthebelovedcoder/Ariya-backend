#!/usr/bin/env node

// test-runner.js
const { spawn } = require('child_process');
const path = require('path');

// Function to run tests
async function runTests() {
  console.log('🧪 Starting API tests...\n');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  let testCommand = 'npm';
  let testArgs = ['run', 'test:run'];
  
  // Check for specific test flags
  if (args.includes('--watch')) {
    testArgs = ['run', 'test'];
  } else if (args.includes('--ui')) {
    testArgs = ['run', 'test:ui'];
  } else if (args.includes('--coverage')) {
    testArgs = ['run', 'test:coverage'];
  } else if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file');
    if (fileIndex !== -1 && args[fileIndex + 1]) {
      const testFile = args[fileIndex + 1];
      testArgs = ['run', 'test:run', '--', testFile];
    }
  }
  
  // Spawn the test process
  const testProcess = spawn(testCommand, testArgs, {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
  });
  
  // Handle process events
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Tests failed with exit code:', code);
      process.exit(code);
    }
  });
  
  testProcess.on('error', (error) => {
    console.error('Failed to start test process:', error);
    process.exit(1);
  });
}

// Run the tests
runTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});