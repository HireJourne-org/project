# Storage Guidelines

This document outlines the standards and best practices for using Supabase Storage in the HireJourne application.

## Storage Buckets

The application uses two main storage buckets:

- `resumes`: For storing user resume files
- `reports`: For storing generated PDF reports

### Important: Bucket Creation

Buckets should only be created via database migrations, not at runtime. Normal users and even authenticated users do not have permission to create new buckets due to Row Level Security (RLS) policies.

If new buckets are needed:
1. Create a migration file in the `supabase/migrations` directory
2. Use SQL to insert the bucket into `storage.buckets`
3. Add appropriate RLS policies for the bucket
4. Apply the migration

## File Path Structure

### Resumes Bucket

All files in the resumes bucket must be stored with the following path structure:

```
{userId}/{uuid}.{extension}
```

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890/c7d8e9f0-1a2b-3c4d-5e6f-7g8h9i0j1k2l.pdf`

This structure ensures:
- Files are organized by user
- Each file has a unique identifier
- Row Level Security (RLS) can correctly enforce access control

### Reports Bucket

Reports should use the submission ID as the filename:

```
{submissionId}.pdf
```

Example: `5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t.pdf`

## Security Policies

The system uses Row Level Security (RLS) to control access to files:

1. **Resumes Bucket**:
   - Users can only upload files to their own user folder
   - Users can only read/delete their own files
   - Files must be placed in a folder named with the user's ID

2. **Reports Bucket**:
   - Authenticated users can read any report
   - Only authenticated users can upload reports

## Best Practices

1. **Always Use Service Functions**:
   - Use `uploadResume()` and `uploadReport()` from `storageService.ts`
   - Avoid direct interaction with storage via `supabase.storage` in components

2. **File Validation**:
   - Always validate file types before upload (PDF, DOC, DOCX for resumes)
   - Enforce size limits (e.g., 5MB max for resumes)
   - Handle validation errors gracefully

3. **Path Generation**:
   - Always get the user ID from the authenticated session
   - Use UUIDs for filenames to prevent collisions
   - Preserve the original file extension

4. **URL Handling**:
   - Store complete public URLs in database records
   - When referencing files, use the public URLs
   - For deletion, extract the path from the URL

5. **Error Handling**:
   - Implement proper error handling for all storage operations
   - Log detailed error messages for debugging
   - Provide user-friendly error messages

## Migrations and Cleanup

The application includes utilities for managing storage:

1. **File Migration**:
   - Use `migrateStorageFiles()` to move files to the correct structure
   - Available in the Admin Dashboard

2. **Reference Synchronization**:
   - Use `syncStorageReferences()` to fix database references
   - Checks if referenced files exist and updates records

## Troubleshooting

Common issues and solutions:

1. **File Not Found Errors**:
   - Check if the file path is correct
   - Verify the user has permission to access the file
   - Check if the file exists using the Storage Explorer in Supabase Dashboard

2. **Upload Errors**:
   - Verify bucket permissions and RLS policies
   - Check file size and type
   - Ensure the user is authenticated

3. **Permission Issues**:
   - Verify the user is authenticated
   - Check if the file is in the correct user folder
   - Review RLS policies for the bucket 