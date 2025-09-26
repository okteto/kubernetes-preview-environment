#!/usr/bin/env node

const http = require('http');

// Test configuration
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '8080';
const BASE_URL = `http://${API_HOST}:${API_PORT}`;

// Helper function to make HTTP requests
function makeRequest(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          console.log(`✅ ${path} - Status: ${res.statusCode}`);
          resolve({ statusCode: res.statusCode, data });
        } else {
          console.log(`❌ ${path} - Expected: ${expectedStatus}, Got: ${res.statusCode}`);
          reject(new Error(`Status code mismatch for ${path}: expected ${expectedStatus}, got ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${path} - Connection failed: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${path} - Request timeout`);
      req.destroy();
      reject(new Error(`Timeout for ${path}`));
    });
  });
}

// Test suite
async function runTests() {
  console.log('🚀 Starting End-to-End API Tests');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    {
      name: 'Health Check',
      path: '/api/healthz',
      validator: (data) => data.data.trim() === 'OK'
    },
    {
      name: 'Movies Endpoint',
      path: '/api/movies',
      validator: (data) => {
        try {
          const movies = JSON.parse(data.data);
          return Array.isArray(movies) && movies.length > 0 && movies[0]._id;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Watching Endpoint',
      path: '/api/watching',
      validator: (data) => {
        try {
          const watching = JSON.parse(data.data);
          return Array.isArray(watching);
        } catch {
          return false;
        }
      }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running: ${test.name}`);
      const result = await makeRequest(test.path);
      
      if (test.validator && !test.validator(result)) {
        throw new Error(`Data validation failed for ${test.name}`);
      }
      
      if (test.path === '/api/movies') {
        const movies = JSON.parse(result.data);
        console.log(`   📊 Found ${movies.length} movies in database`);
        if (movies.length > 0) {
          console.log(`   🎬 Sample movie: "${movies[0].original_title || movies[0].title}"`);
        }
      }
      
      passed++;
      console.log(`   ✅ ${test.name} passed`);
    } catch (error) {
      failed++;
      console.log(`   ❌ ${test.name} failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total:  ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is functioning correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check the API and database.');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});