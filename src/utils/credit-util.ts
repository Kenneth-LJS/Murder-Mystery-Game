export function isCreditPage() {
    return new URLSearchParams(window.location.search).get('c') === '1';
}
