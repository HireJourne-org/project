import { describe, it, expect, beforeAll } from 'vitest';
import { testStorageService, verifyStorageSetup } from '../services/testStorageService';
import { supabase } from '../services/supabaseService';

describe('Storage Service', () => {
  beforeAll(async () => {
    // Sign in as the dedicated test user so storage RLS applies.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const email = import.meta.env.VITE_TEST_USER_EMAIL;
      const password = import.meta.env.VITE_TEST_USER_PASSWORD;
      if (!email || !password) {
        throw new Error('Set VITE_TEST_USER_EMAIL and VITE_TEST_USER_PASSWORD to run storage integration tests');
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(`Test user sign-in failed: ${error.message}`);
      }
    }
  });

  it('should verify storage setup', async () => {
    const isValid = await verifyStorageSetup();
    expect(isValid).toBe(true);
  });

  it('should run all storage tests successfully', async () => {
    const result = await testStorageService();
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    
    // Verify all test details
    expect(result.details.resumeUpload).toBe(true);
    expect(result.details.reportUpload).toBe(true);
    expect(result.details.resumeDelete).toBe(true);
    expect(result.details.publicUrl).toBe(true);
  });

  it('should handle bucket operations', async () => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    expect(error).toBeNull();
    expect(buckets).toBeDefined();
    
    const requiredBuckets = ['resumes', 'reports'];
    requiredBuckets.forEach(bucketName => {
      expect(buckets?.some(b => b.name === bucketName)).toBe(true);
    });
  });

  it('should handle file operations in resumes bucket', async () => {
    const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const path = 'test/test.pdf';

    // Upload
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(path, testFile);
    expect(uploadError).toBeNull();

    // Get URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(path);
    expect(urlData.publicUrl).toBeDefined();

    // Delete
    const { error: deleteError } = await supabase.storage
      .from('resumes')
      .remove([path]);
    expect(deleteError).toBeNull();
  });

  it('should handle file operations in reports bucket', async () => {
    const testReport = new Blob(['test report'], { type: 'application/pdf' });
    const path = 'test-report.pdf';

    // Upload
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, testReport);
    expect(uploadError).toBeNull();

    // Get URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(path);
    expect(urlData.publicUrl).toBeDefined();

    // Delete
    const { error: deleteError } = await supabase.storage
      .from('reports')
      .remove([path]);
    expect(deleteError).toBeNull();
  });
});