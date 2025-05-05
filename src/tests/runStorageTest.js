import { testStorageService, verifyStorageSetup } from '../services/testStorageService';

async function runTests() {
  console.log('\n🚀 Starting storage tests...\n');

  try {
    // Step 1: Verify storage setup
    console.log('Step 1: Verifying storage setup...');
    const isValid = await verifyStorageSetup();
    
    if (!isValid) {
      throw new Error('Storage setup verification failed');
    }
    
    console.log('✅ Storage setup verified\n');

    // Step 2: Run storage service tests
    console.log('Step 2: Running storage service tests...');
    const result = await testStorageService();

    if (!result.success) {
      throw new Error(`Storage tests failed: ${result.error}`);
    }

    // Print test details
    console.log('\n📊 Test Results:');
    console.log('----------------');
    Object.entries(result.details).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    console.log('\n✨ All storage tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

runTests();