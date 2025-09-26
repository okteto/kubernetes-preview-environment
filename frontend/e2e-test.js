#!/usr/bin/env node

const http = require('http');

// Test configuration  
const FRONTEND_HOST = process.env.FRONTEND_HOST || 'localhost';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '80';
const API_HOST = process.env.API_HOST || 'api';
const API_PORT = process.env.API_PORT || '8080';

// Helper function to make HTTP requests
function makeRequest(host, port, path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `http://${host}:${port}${path}`;
    console.log(`Testing: ${url}`);
    
    const req = http.get({ host, port, path }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          console.log(`✅ ${path} - Status: ${res.statusCode}`);
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
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
  console.log('🌐 Starting End-to-End Frontend & API Integration Tests');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    {
      name: 'Frontend Root Page',
      test: () => makeRequest(FRONTEND_HOST, FRONTEND_PORT, '/'),
      validator: (result) => result.data.includes('Movies') && result.headers['content-type'].includes('text/html')
    },
    {
      name: 'API Health Check via Frontend',
      test: () => makeRequest(FRONTEND_HOST, FRONTEND_PORT, '/api/healthz'),
      validator: (result) => result.data.trim() === 'OK'
    },
    {
      name: 'API Movies Data via Frontend',
      test: () => makeRequest(FRONTEND_HOST, FRONTEND_PORT, '/api/movies'),
      validator: (result) => {
        try {
          const movies = JSON.parse(result.data);
          return Array.isArray(movies) && movies.length > 0;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Direct API Health Check',
      test: () => makeRequest(API_HOST, API_PORT, '/api/healthz'),
      validator: (result) => result.data.trim() === 'OK'
    },
    {
      name: 'Direct API Movies Data',
      test: () => makeRequest(API_HOST, API_PORT, '/api/movies'),
      validator: (result) => {
        try {
          const movies = JSON.parse(result.data);
          return Array.isArray(movies) && movies.length > 0;
        } catch {
          return false;
        }
      }
    }
  ];
  
  for (const testCase of tests) {
    try {
      console.log(`\n🧪 Running: ${testCase.name}`);
      const result = await testCase.test();
      
      if (testCase.validator && !testCase.validator(result)) {
        throw new Error(`Data validation failed for ${testCase.name}`);
      }
      
      if (testCase.name.includes('Movies Data')) {
        try {
          const movies = JSON.parse(result.data);
          console.log(`   📊 Found ${movies.length} movies`);
          if (movies.length > 0) {
            console.log(`   🎬 Sample: "${movies[0].original_title || movies[0].title}"`);
          }
        } catch (e) {
          // Non-JSON response, skip movie details
        }
      }
      
      passed++;
      console.log(`   ✅ ${testCase.name} passed`);
    } catch (error) {
      failed++;
      console.log(`   ❌ ${testCase.name} failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Integration Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total:  ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Frontend and API are working together correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check the frontend, API, and database connectivity.');
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
  console.error('Integration test suite failed:', error);
  process.exit(1);
});