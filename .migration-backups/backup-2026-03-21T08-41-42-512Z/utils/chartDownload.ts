/**
 * Download chart as PNG image
 * Note: In production, install html2canvas: npm install html2canvas
 * This is a simplified version using native canvas API
 */

export const downloadChartAsPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    // Check if html2canvas is available (for production use)
    if (typeof window !== 'undefined' && (window as any).html2canvas) {
      const html2canvas = (window as any).html2canvas;
      const canvas = await html2canvas(element, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        scale: 2, // Higher quality
      });

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } else {
      // Fallback: Use native method to capture SVG charts
      await downloadSVGChart(element, filename);
    }
  } catch (error) {
    console.error('Error downloading chart:', error);
    alert('Failed to download chart. Please try again.');
  }
};

/**
 * Download SVG chart as PNG (fallback method)
 */
const downloadSVGChart = async (element: HTMLElement, filename: string) => {
  const svg = element.querySelector('svg');
  if (!svg) {
    alert('No chart found to download');
    return;
  }

  // Get SVG data
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  // Set canvas size
  const bbox = svg.getBoundingClientRect();
  canvas.width = bbox.width * 2; // 2x for better quality
  canvas.height = bbox.height * 2;

  // Scale context
  ctx.scale(2, 2);

  // Set background
  const isDark = document.documentElement.classList.contains('dark');
  ctx.fillStyle = isDark ? '#111827' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create image from SVG
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }
    });
  };

  img.src = url;
};

/**
 * Download chart data as CSV
 */
export const downloadChartDataAsCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Copy chart image to clipboard
 */
export const copyChartToClipboard = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    if ((window as any).html2canvas) {
      const html2canvas = (window as any).html2canvas;
      const canvas = await html2canvas(element, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        scale: 2,
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (blob && navigator.clipboard) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          alert('Chart copied to clipboard!');
        }
      });
    }
  } catch (error) {
    console.error('Error copying chart:', error);
    alert('Failed to copy chart');
  }
};
