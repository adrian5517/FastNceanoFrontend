// Lightweight scanner input sanitizer used by the kiosk UI.
export function cleanScannerString(s) {
  if (!s || typeof s !== 'string') return s;
  let out = s;
  // remove non-printable/control chars (except newline/return if needed)
  out = out.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // collapse doubled braces/quotes/colons/commas
  out = out.replace(/\{\{+/g, '{').replace(/\}\}+/g, '}');
  out = out.replace(/""+/g, '"').replace(/::+/g, ':').replace(/,,+/g, ',');
  // collapse long repeated runs of the same character (3 or more) to a single char
  out = out.replace(/(.)\1{2,}/g, '$1');
  // collapse repeated hyphens/underscores
  out = out.replace(/[-_]{2,}/g, '-');
  // trim whitespace
  out = out.trim();
  return out;
}

export default cleanScannerString;
