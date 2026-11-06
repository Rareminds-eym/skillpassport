import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { normalizePptxRelationships } from '../normalizePptxRelationships';

describe('PPTX relationship compatibility', () => {
  it('normalizes prefixed relationships while retaining relationship IDs and targets', async () => {
    const zip = new JSZip();
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0"?><ns0:Relationships xmlns:ns0="http://schemas.openxmlformats.org/package/2006/relationships"><ns0:Relationship Id="rId2" Type="slide" Target="slides/slide1.xml" /></ns0:Relationships>`);
    zip.file('ppt/slides/slide1.xml', '<slide/>');
    zip.file('[Content_Types].xml', '<ns0:Types xmlns:ns0="http://schemas.openxmlformats.org/package/2006/content-types"><ns0:Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml" /></ns0:Types>');
    const result = await JSZip.loadAsync(await normalizePptxRelationships(await zip.generateAsync({ type: 'arraybuffer' })));
    const xml = await result.file('ppt/_rels/presentation.xml.rels')!.async('string');
    expect(xml).toContain('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">');
    expect(xml).toContain('<Relationship Id="rId2" Type="slide" Target="slides/slide1.xml"');
    expect(await result.file('ppt/slides/slide1.xml')!.async('string')).toBe('<slide/>');
    const types = await result.file('[Content_Types].xml')!.async('string');
    expect(types).toContain('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">');
    expect(types).toContain('<Override PartName="/ppt/slides/slide1.xml"');
  });
  it('leaves already compatible presentations unchanged', async () => {
    const zip = new JSZip();
    zip.file('ppt/_rels/presentation.xml.rels', '<Relationships><Relationship Id="rId2"/></Relationships>');
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    expect(await normalizePptxRelationships(buffer)).toBe(buffer);
  });
});
