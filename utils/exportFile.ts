import { Capacitor } from '@capacitor/core';

/**
 * Export a CSV/text file — works on Android + Web
 * On Android: writes to cache then shares via native share sheet
 * On Web: uses anchor download
 */
export async function exportFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      // اكتب الملف في الـ cache
      const result = await Filesystem.writeFile({
        path: filename,
        data: btoa(unescape(encodeURIComponent(content))), // base64 UTF-8
        directory: Directory.Cache,
      });

      // شارك الملف عبر native share sheet
      await Share.share({
        title: filename,
        url: result.uri,
        dialogTitle: 'Share / Save File',
      });
    } catch (e) {
      console.error('Export error:', e);
      alert('Export failed: ' + String(e));
    }
  } else {
    // Web: anchor download
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
