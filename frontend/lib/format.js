export function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function readingTime(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
}

// Splits plain text on blank lines. Post content is plain text, never HTML.
export function toParagraphs(text) {
    return (text || '')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

export function initials(name) {
    return (
        (name || '?')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((s) => s[0])
            .join('') || '?'
    );
}

export function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
}
