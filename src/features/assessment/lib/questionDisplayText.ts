/** Known legacy UTF-8 currency corruption from Windows-encoded seed dumps.
 * Display only: persisted options remain unchanged for answer matching/grading.
 * Do not re-decode arbitrary Unicode or guess at replacement characters.
 */
export function questionDisplayText(text: string): string {
  return text
    .replace(/\u251c\u00f3\u0393\u00c7\u00dc\u252c\u2563/g, '\u20b9')
    .replace(/\u0393\u00e9\u2563/g, '\u20b9')
    .replace(/\u00e2\u201a\u00b9/g, '\u20b9');
}
