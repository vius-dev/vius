/**
 * Strips HTML tags from a string and returns plain text
 * @param html - HTML string to strip tags from
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
    if (!html) return '';

    // Remove HTML tags using regex
    // This handles most common cases including nested tags and attributes
    return html
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/&#39;/g, "'") // Replace &#39; with '
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace
}

/**
 * Strips HTML tags and truncates text to a maximum length
 * @param html - HTML string to process
 * @param maxLength - Maximum length of the resulting text
 * @returns Truncated plain text
 */
export function truncateHtml(html: string, maxLength: number): string {
    const plainText = stripHtmlTags(html);

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return plainText.substring(0, maxLength).trim() + '...';
}
