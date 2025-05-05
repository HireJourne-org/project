import { supabase } from './supabaseService';
import { v4 as uuidv4 } from 'uuid';

export const uploadResume = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF and Word documents are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('❌ Upload Resume Error:', uploadError.message);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    console.log('✅ Resume uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading resume:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload resume');
  }
};

export const uploadReport = async (reportId: string, content: string): Promise<string> => {
  try {
    const fileName = `${reportId}.pdf`;

    // Convert content to Blob
    const blob = new Blob([content], { type: 'application/pdf' });

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('❌ Upload Report Error:', uploadError.message);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    console.log('✅ Report uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading report:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload report');
  }
};

export const deleteResume = async (filePath: string): Promise<void> => {
  try {
    console.log('🗑️ Attempting to delete file:', filePath);
    
    // Handle both URL format and direct path format
    let relativePath = filePath;
    
    // If it's a URL, extract the path
    if (filePath.includes('supabase.co')) {
      // Extract the path after the bucket name
      const parts = filePath.split('/resumes/');
      if (parts.length > 1) {
        relativePath = parts[1];
      } else {
        throw new Error('Invalid file path');
      }
    }
    
    console.log('🗑️ Deleting file with path:', relativePath);
    
    const { error } = await supabase.storage
      .from('resumes')
      .remove([relativePath]);

    if (error) {
      console.error('❌ Delete Resume Error:', error.message);
      throw error;
    }

    console.log('✅ Resume deleted successfully:', relativePath);
  } catch (error) {
    console.error('❌ Error deleting resume:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete resume');
  }
};

export const testStorage = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing storage functionality...');

    // Test file for upload
    const testFile = new File(['Test content'], 'test.pdf', { type: 'application/pdf' });
    const testUserId = uuidv4();

    // Test resume upload
    console.log('📤 Testing resume upload...');
    const resumeUrl = await uploadResume(testFile, testUserId);
    console.log('✅ Resume upload test passed');

    // Test report upload
    console.log('📤 Testing report upload...');
    const reportId = uuidv4();
    const reportUrl = await uploadReport(reportId, 'Test report content');
    console.log('✅ Report upload test passed');

    // Test resume deletion
    console.log('🗑️ Testing resume deletion...');
    await deleteResume(resumeUrl);
    console.log('✅ Resume deletion test passed');

    console.log('✅ All storage tests passed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
};

/**
 * Updates database references to migrated files
 */
export const updateFileReferences = async (oldUrl: string, newUrl: string): Promise<boolean> => {
  try {
    console.log(`🔄 Updating references from ${oldUrl} to ${newUrl}`);
    
    // Get public URLs for old and new paths
    const oldPublicUrl = supabase.storage
      .from('resumes')
      .getPublicUrl(oldUrl).data.publicUrl;
      
    const newPublicUrl = supabase.storage
      .from('resumes')
      .getPublicUrl(newUrl).data.publicUrl;
    
    // Update references in interviews table
    const { error: interviewsError } = await supabase
      .from('interviews')
      .update({ resume_url: newPublicUrl })
      .eq('resume_url', oldPublicUrl);
      
    if (interviewsError) {
      console.error('❌ Failed to update references in interviews table:', interviewsError.message);
    }
    
    // Update references in submissions table
    const { error: submissionsError } = await supabase
      .from('submissions')
      .update({ resume_url: newPublicUrl })
      .eq('resume_url', oldPublicUrl);
      
    if (submissionsError) {
      console.error('❌ Failed to update references in submissions table:', submissionsError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating file references:', error);
    return false;
  }
};

export const migrateStorageFiles = async (): Promise<{success: boolean, migratedFiles: number, errors: number}> => {
  try {
    console.log('🔄 Starting storage migration...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Migration failed: User not authenticated');
      return { success: false, migratedFiles: 0, errors: 0 };
    }
    
    // Get all files in the uploads folder
    const { data: files, error: listError } = await supabase.storage
      .from('resumes')
      .list('uploads');
      
    if (listError) {
      console.error('❌ Failed to list files:', listError.message);
      return { success: false, migratedFiles: 0, errors: 0 };
    }
    
    if (!files?.length) {
      console.log('✅ No files to migrate');
      return { success: true, migratedFiles: 0, errors: 0 };
    }
    
    console.log(`🔍 Found ${files.length} files to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Move each file to the correct location
    for (const file of files) {
      try {
        console.log(`🔄 Migrating file: ${file.name}`);
        
        // Download existing file
        const { data, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(`uploads/${file.name}`);
          
        if (downloadError || !data) {
          console.error(`❌ Failed to download file ${file.name}:`, downloadError?.message);
          errorCount++;
          continue;
        }
        
        // Generate new path with user ID and UUID
        const fileExt = file.name.split('.').pop();
        const newPath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        // Upload to new location
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(newPath, data, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error(`❌ Failed to upload file to new location ${newPath}:`, uploadError.message);
          errorCount++;
          continue;
        }
        
        // Get new public URL
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(newPath);
        
        console.log(`✅ File migrated to: ${newPath}`);
        
        // Update database references to this file
        await updateFileReferences(`uploads/${file.name}`, newPath);
        
        // Remove old file
        const { error: removeError } = await supabase.storage
          .from('resumes')
          .remove([`uploads/${file.name}`]);
          
        if (removeError) {
          console.error(`⚠️ Warning: Failed to remove old file ${file.name}:`, removeError.message);
          // Don't count this as a full error since the migration was still successful
        }
        
        migratedCount++;
      } catch (err) {
        console.error(`❌ Error migrating file ${file.name}:`, err);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration complete. Migrated ${migratedCount}/${files.length} files with ${errorCount} errors.`);
    return { success: true, migratedFiles: migratedCount, errors: errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, migratedFiles: 0, errors: 1 };
  }
};

/**
 * Synchronizes database records with storage files
 * Checks if referenced files exist and updates records accordingly
 */
export const syncStorageReferences = async (): Promise<{ success: boolean, fixed: number, total: number }> => {
  try {
    console.log('🔄 Starting storage references synchronization...');
    
    let fixedCount = 0;
    let totalCount = 0;
    
    // Check interviews table
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('id, resume_url')
      .not('resume_url', 'is', null);
      
    if (interviewsError) {
      console.error('❌ Error fetching interviews:', interviewsError.message);
      throw interviewsError;
    }
    
    console.log(`🔍 Found ${interviews?.length || 0} interviews with resume URLs`);
    totalCount += interviews?.length || 0;
    
    // Check each interview resume URL
    for (const interview of interviews || []) {
      try {
        if (!interview.resume_url) continue;
        
        // Extract path from URL
        let path = '';
        if (interview.resume_url.includes('/resumes/')) {
          path = interview.resume_url.split('/resumes/')[1];
        }
        
        if (!path) {
          console.warn(`⚠️ Invalid resume URL format: ${interview.resume_url}`);
          continue;
        }
        
        // Check if file exists
        const { data, error } = await supabase.storage
          .from('resumes')
          .download(path);
          
        if (error) {
          console.log(`🔄 File not found for interview ${interview.id}, updating record...`);
          
          // Update record to remove reference
          const { error: updateError } = await supabase
            .from('interviews')
            .update({ resume_url: null })
            .eq('id', interview.id);
            
          if (updateError) {
            console.error(`❌ Error updating interview ${interview.id}:`, updateError.message);
            continue;
          }
          
          fixedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing interview ${interview.id}:`, err);
      }
    }
    
    // Check submissions table
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('submission_id, report_link')
      .not('report_link', 'is', null);
      
    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError.message);
      throw submissionsError;
    }
    
    console.log(`🔍 Found ${submissions?.length || 0} submissions with report links`);
    totalCount += submissions?.length || 0;
    
    // Check each submission report link
    for (const submission of submissions || []) {
      try {
        if (!submission.report_link) continue;
        
        // Extract path from URL
        let path = '';
        if (submission.report_link.includes('/reports/')) {
          path = submission.report_link.split('/reports/')[1];
        }
        
        if (!path) {
          console.warn(`⚠️ Invalid report link format: ${submission.report_link}`);
          continue;
        }
        
        // Check if file exists
        const { data, error } = await supabase.storage
          .from('reports')
          .download(path);
          
        if (error) {
          console.log(`🔄 File not found for submission ${submission.submission_id}, updating record...`);
          
          // Update record to remove reference
          const { error: updateError } = await supabase
            .from('submissions')
            .update({ report_link: null })
            .eq('submission_id', submission.submission_id);
            
          if (updateError) {
            console.error(`❌ Error updating submission ${submission.submission_id}:`, updateError.message);
            continue;
          }
          
          fixedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing submission ${submission.submission_id}:`, err);
      }
    }
    
    console.log(`✅ Synchronization complete. Fixed ${fixedCount}/${totalCount} references.`);
    return { success: true, fixed: fixedCount, total: totalCount };
  } catch (error) {
    console.error('❌ Synchronization failed:', error);
    return { success: false, fixed: 0, total: 0 };
  }
};