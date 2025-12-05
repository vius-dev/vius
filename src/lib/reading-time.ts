/**
 * Calculate reading time for an article body
 * @param text - The article body text
 * @returns Reading time in minutes
 */
export function calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes); // Minimum 1 minute
}
