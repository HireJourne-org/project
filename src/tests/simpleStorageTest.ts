import { simpleStorageTest } from '../services/testStorageService';

async function runTest() {
  console.log('\n🚀 Starting storage test...\n');

  try {
    const success = await simpleStorageTest();
    
    if (success) {
      console.log('\n✨ Storage test completed successfully!\n');
      process.exit(0);
    } else {
      console.error('\n❌ Storage test failed\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTest();