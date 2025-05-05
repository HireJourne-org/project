import { testStorage } from '../services/storageService';

async function runStorageTest() {
  console.log('\n🚀 Starting storage tests...\n');

  try {
    const success = await testStorage();
    
    if (success) {
      console.log('\n✨ Storage functionality verified successfully!\n');
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

runStorageTest();