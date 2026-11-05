import JSZip from 'jszip';

const RELATIONSHIPS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CONTENT_TYPES_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';

/** Work around the viewer expecting unprefixed relationship element names. */
export async function normalizePptxRelationships(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(buffer);
  const files = Object.values(zip.files).filter(file => !file.dir && (file.name.endsWith('.rels') || file.name === '[Content_Types].xml'));
  let changed = false;
  for (const file of files) {
    const xml = await file.async('string');
    const contentTypes = file.name === '[Content_Types].xml';
    const namespace = contentTypes ? CONTENT_TYPES_NS : RELATIONSHIPS_NS;
    const elements = contentTypes ? 'Types|Default|Override' : 'Relationships|Relationship';
    const root = xml.match(contentTypes ? /<([\w.-]+):Types\b[^>]*>/ : /<([\w.-]+):Relationships\b[^>]*>/);
    if (!root) continue;
    const prefix = root[1];
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const declaration = new RegExp(`\\sxmlns:${escaped}=(['"])${namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`);
    if (!declaration.test(root[0]) || /\sxmlns=/.test(root[0])) continue;
    const normalized = xml.replace(declaration, ` xmlns="${namespace}"`)
      .replace(new RegExp(`(<\\/?)(?:${escaped}:)(${elements})(?=[\\s/>])`, 'g'), '$1$2');
    zip.file(file.name, normalized);
    changed = true;
  }
  return changed ? zip.generateAsync({ type: 'arraybuffer' }) : buffer;
}
