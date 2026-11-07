// A bare key press (no Ctrl/Cmd/Alt) outside any text field — the only kind
// the site's single-letter shortcuts react to.
export function isPlainKeypress(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  const el = event.target
  if (!el) return true
  return !/^(input|textarea|select)$/i.test(el.tagName || '') && !el.isContentEditable
}
