from pathlib import Path
import json, zipfile, xml.etree.ElementTree as ET, hashlib
from pypdf import PdfReader

root = Path.cwd()
out = root / 'tmp' / 'audit'
out.mkdir(parents=True, exist_ok=True)
sources = []
for base in [root, *[p for p in root.iterdir() if p.is_dir() and p.name.startswith('โครงการ')]]:
    paths = base.iterdir() if base == root else base.rglob('*')
    for p in sorted(paths):
        if not p.is_file() or p.suffix.lower() not in ['.doc','.docx','.pdf','.xls','.xlsx','.jpg','.png']:
            continue
        rec = {'path':str(p.relative_to(root)), 'extension':p.suffix.lower(), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
        try:
            if p.suffix.lower()=='.docx':
                with zipfile.ZipFile(p) as z:
                    tree=ET.fromstring(z.read('word/document.xml'))
                ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                rec['text']='\n'.join(''.join(t.text or '' for t in n.findall('.//w:t', ns)) for n in tree.findall('.//w:p', ns))
                rec['status']='extracted_ooxml'
            elif p.suffix.lower()=='.pdf':
                reader=PdfReader(str(p))
                rec['pages']=len(reader.pages)
                rec['text']='\n'.join(f'PAGE {i+1}\n'+(page.extract_text() or '') for i,page in enumerate(reader.pages))
                rec['status']='extracted_pdf' if len(rec['text'].strip()) > 60 else 'needs_ocr'
            elif p.suffix.lower() in ['.xls','.xlsx']:
                rec['status']='spreadsheet_pending'
            elif p.suffix.lower()=='.doc':
                rec['status']='legacy_doc_needs_conversion'
            else:
                rec['status']='image_needs_visual_review'
        except Exception as e:
            rec['status']='extraction_error'
            rec['error']=str(e)
        sources.append(rec)
(out/'sources.json').write_text(json.dumps(sources, ensure_ascii=False,indent=2),encoding='utf-8')
from collections import Counter
print(json.dumps({'files':len(sources),'types':dict(Counter(r['extension'] for r in sources)),'status':dict(Counter(r['status'] for r in sources))},ensure_ascii=False))
