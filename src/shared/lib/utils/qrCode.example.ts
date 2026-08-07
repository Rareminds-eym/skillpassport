/**
 * Usage Examples for generateProfileQRCode utility
 * 
 * This file demonstrates how to use the QR code generation utility
 * in different scenarios within the SkillPassport application.
 */

import { generateProfileQRCode, generateProfileQRCodeSync } from './qrCode';

// ============================================================================
// Example 1: Basic Usage - Async/Await Pattern
// ============================================================================

async function basicUsageExample() {
    try {
        const learnerId = 'learner-123';
        const qrCodeDataUrl = await generateProfileQRCode(learnerId);

        console.log('QR Code generated successfully!');
        console.log('Data URL:', qrCodeDataUrl.substring(0, 50) + '...');

        // Use the data URL in an <img> tag
        // <img src={qrCodeDataUrl} alt="Profile QR Code" />

        return qrCodeDataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw error;
    }
}

// ============================================================================
// Example 2: React Component Usage with useState
// ============================================================================

/*
import React, { useState, useEffect } from 'react';
import { generateProfileQRCode } from '@/shared/lib/utils';

function StudentProfileCard({ learnerId }: { learnerId: string }) {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQRCode() {
      try {
        setLoading(true);
        const dataUrl = await generateProfileQRCode(learnerId);
        setQrCode(dataUrl);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    }

    if (learnerId) {
      loadQRCode();
    }
  }, [learnerId]);

  if (loading) return <div>Generating QR code...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="profile-card">
      <img 
        src={qrCode} 
        alt="Student Profile QR Code" 
        className="w-32 h-32"
      />
      <p>Scan to view profile</p>
    </div>
  );
}
*/

// ============================================================================
// Example 3: Using generateProfileQRCodeSync for Event Handlers
// ============================================================================

function syncUsageExample() {
    const learnerId = 'learner-456';

    // Use sync version in event handlers or callbacks
    generateProfileQRCodeSync(
        learnerId,
        (dataUrl) => {
            console.log('QR Code ready!');
            // Update UI with QR code
            document.getElementById('qr-image')?.setAttribute('src', dataUrl);
        },
        (error) => {
            console.error('QR generation failed:', error.message);
            // Show error to user
            alert(`Failed to generate QR code: ${error.message}`);
        }
    );
}

// ============================================================================
// Example 4: Batch QR Code Generation for Multiple Learners
// ============================================================================

async function batchGenerationExample(learnerIds: string[]) {
    const results = await Promise.allSettled(
        learnerIds.map(id => generateProfileQRCode(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    console.log(`Generated ${successful.length} QR codes successfully`);
    console.log(`${failed.length} failed`);

    return results.map((result, index) => ({
        learnerId: learnerIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
    }));
}

// ============================================================================
// Example 5: Download QR Code as Image File
// ============================================================================

async function downloadQRCodeExample(learnerId: string, filename: string = 'profile-qr.png') {
    try {
        const dataUrl = await generateProfileQRCode(learnerId);

        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(link.href);

        console.log('QR code downloaded successfully');
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}

// ============================================================================
// Example 6: Error Handling with Validation
// ============================================================================

async function robustUsageExample(learnerId: string | null | undefined) {
    // Validate input before calling the function
    if (!learnerId || typeof learnerId !== 'string' || learnerId.trim().length === 0) {
        console.error('Invalid learner ID provided');
        return null;
    }

    try {
        const qrCode = await generateProfileQRCode(learnerId);
        return qrCode;
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Invalid learnerId')) {
                console.error('Validation error:', error.message);
                // Handle validation error (e.g., show user-friendly message)
            } else if (error.message.includes('Failed to generate')) {
                console.error('Generation error:', error.message);
                // Handle generation error (e.g., retry, use fallback)
            }
        }
        return null;
    }
}

// ============================================================================
// Example 7: Integration with React Query
// ============================================================================

/*
import { useQuery } from '@tanstack/react-query';
import { generateProfileQRCode } from '@/shared/lib/utils';

function useProfileQRCode(learnerId: string) {
  return useQuery({
    queryKey: ['profile-qr', learnerId],
    queryFn: () => generateProfileQRCode(learnerId),
    staleTime: 1000 * 60 * 60, // 1 hour - QR codes don't change often
    enabled: !!learnerId,
  });
}

// Usage in component:
function ProfileCard({ learnerId }: { learnerId: string }) {
  const { data: qrCode, isLoading, error } = useProfileQRCode(learnerId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <img src={qrCode} alt="Profile QR Code" />;
}
*/

// ============================================================================
// Example 8: Server-Side Generation (Node.js)
// ============================================================================

/*
// In a Node.js environment (e.g., API route, server action)
async function generateQRForEmail(learnerId: string) {
  try {
    // The function handles SSR automatically (uses fallback URL)
    const qrCodeDataUrl = await generateProfileQRCode(learnerId);
    
    // Can be embedded in email HTML
    const emailHtml = `
      <div>
        <h2>Your Student Profile</h2>
        <p>Scan this QR code to view your profile:</p>
        <img src="${qrCodeDataUrl}" alt="Profile QR Code" />
      </div>
    `;
    
    return emailHtml;
  } catch (error) {
    console.error('Server-side QR generation failed:', error);
    throw error;
  }
}
*/

// Export examples for testing or documentation
export {
    basicUsageExample,
    syncUsageExample,
    batchGenerationExample,
    downloadQRCodeExample,
    robustUsageExample
};
