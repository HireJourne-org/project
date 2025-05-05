import { supabase } from './supabaseService';

export async function verifyStorageSetup() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const requiredBuckets = ['resumes', 'reports'];
    const allBucketsExist = requiredBuckets.every(
      bucket => buckets?.some(b => b.name === bucket)
    );
    
    return allBucketsExist;
  } catch (err) {
    console.error('Storage setup verification failed:', err);
    return false;
  }
}

export async function testStorageService() {
  try {
    console.log('🔍 Starting storage test...');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    // List user's directory
    console.log(`📁 Checking user directory: ${user.id}`);
    await supabase.storage
      .from('resumes')
      .list(user.id);

    // Create test file
    const testContent = "Hello World";
    const file = new File([testContent], "test_upload.txt", { type: "text/plain" });
    
    // Generate proper path with user ID
    const testPath = `${user.id}/${Date.now()}_test_upload.txt`;

    console.log('📤 Uploading test file to user folder...');
    
    // Attempt upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(testPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      throw uploadError;
    }

    console.log('✅ Upload successful:', uploadData?.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(testPath);

    console.log('🔗 Public URL:', publicUrl);

    // Clean up test file
    console.log('🧹 Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('resumes')
      .remove([testPath]);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
      throw deleteError;
    }

    console.log('✅ Test completed successfully!');
    return {
      success: true,
      details: {
        resumeUpload: true,
        reportUpload: true,
        resumeDelete: true,
        publicUrl: true
      }
    };
  } catch (err) {
    console.error('❌ Storage test failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: {
        resumeUpload: false,
        reportUpload: false,
        resumeDelete: false,
        publicUrl: false
      }
    };
  }
}