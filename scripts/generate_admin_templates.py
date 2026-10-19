"""สร้าง lib/adminTemplates.json จากไฟล์ Word ต้นฉบับ 5 ฉบับ (ต้นแบบมีแค่ไฟล์ Word เท่านั้น)
ใช้: python gen_templates.py <โฟลเดอร์ธุระการv2> <ไฟล์ json ปลายทาง>
"""
import html
import json
import re
import sys
import zipfile

ROOT, OUT = sys.argv[1], sys.argv[2]

FILES = {
    'memo': ('บันทึกข้อความ', 'บันทึกข้อความ/1741  เชิญผู้เชี่ยวชาญ.docx'),
    'memo_circular': ('บันทึกข้อความ (ว)', 'บักทึกข้อความ ( ว )/ว 721.docx'),
    'external': ('หนังสือภายนอก', 'หนังสือภายนอก/864 ตอบรับการเผยแพร่ผลงาน.docx'),
    'external_circular': ('หนังสือภายนอก (ว)', 'หนังสือภายนอก (ว)/ว 520 เชิญวิทยากร.docx'),
    'order': ('คำสั่ง', 'คำสั่ง/70 คำสั่งคณะกรรมการดำเนินงาน 3 สาขาวิชา.docx'),
}
ROLES = ('ประธานกรรมการ', 'รองประธานกรรมการ', 'กรรมการและเลขานุการ', 'กรรมการและผู้ช่วยเลขานุการ', 'ผู้ช่วยเลขานุการ', 'กรรมการ', 'ที่ปรึกษา')


PAGE_BREAK = '[ขึ้นหน้าใหม่]'  # ตรงกับ PAGE_BREAK_TEXT ใน lib/richBody.ts


def para_text(p, page_breaks=False):
    if page_breaks and 'w:type="page"' in p and not re.search(r'<w:t[^>]*>[^<]*\S', p):
        return PAGE_BREAK  # ย่อหน้าตัวแบ่งหน้า (Ctrl+Enter) ของต้นฉบับ
    out = []
    for m in re.finditer(r'<w:t[^>]*>([^<]*)</w:t>|<w:tab/>|<w:br/>', p):
        out.append(m.group(1) if m.group(1) is not None else ('\t' if m.group(0) == '<w:tab/>' else '\n'))
    return html.unescape(''.join(out)).replace('​', '')


def paragraphs(xml, page_breaks=False):
    return [para_text(p, page_breaks) for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)]


def squash(s):
    return re.sub(r'\s+', ' ', s.replace('\t', ' ')).strip()


def load(path, page_breaks=False):
    z = zipfile.ZipFile(path)
    body = paragraphs(z.read('word/document.xml').decode('utf8'), page_breaks)
    header = []
    for n in z.namelist():
        if re.match(r'word/header\d*\.xml', n):
            header += paragraphs(z.read(n).decode('utf8'))
    return header, body


def strip_label(s, label):
    return squash(re.sub('^\\s*' + label + '\\s*', '', s.strip()))


def signature(lines, start=0):
    """คืน (ชื่อ, ตำแหน่ง, ดัชนีบรรทัดสุดท้ายของตำแหน่ง) จากย่อหน้าที่ขึ้นต้นด้วย ( """
    for i in range(start, len(lines)):
        t = squash(lines[i])
        if t.startswith('(') and t.endswith(')'):
            name = squash(t[1:-1])
            pos, j = [], i + 1
            while j < len(lines) and squash(lines[j]) and len(pos) < 3:
                pos.append(squash(lines[j]))
                j += 1
            return name, '\n'.join(pos), j
    return '', '', len(lines)


def memo(path):
    header, body = load(path)
    h = [squash(x) for x in header if squash(x)]
    frm = next((strip_label(x, 'ส่วนราชการ') for x in h if x.startswith('ส่วนราชการ')), '')
    frm = re.sub(r'\s*ที่\s*อว.*$', '', frm)
    # ไฟล์ต้นฉบับมีเลขเกินท้ายเบอร์โทร (ตัวเลขจากช่องถัดไปในหัวกระดาษ) เก็บเฉพาะเบอร์ภายใน 4 หลัก
    frm = re.sub(r'(โทร\.?\s*\d{4})\d+$', r'\1', frm)
    subject = next((strip_label(x, 'เรื่อง') for x in h if x.startswith('เรื่อง')), '')
    b = [x for x in body if squash(x)]
    to_i = next(i for i, x in enumerate(b) if squash(x).startswith('เรียน'))
    to = strip_label(b[to_i], 'เรียน')
    name, position, _ = signature(b, to_i)
    sig_i = next(i for i, x in enumerate(b) if squash(x).startswith('('))
    paras = [squash(x) for x in b[to_i + 1:sig_i] if squash(x)]
    return dict(**{'from': frm}, to=to, subject=subject, bodyText='\n\n'.join(paras),
                signatoryName=name, signatoryPosition=position)


def letter(path, first_only=False):
    _, body = load(path)
    # หนังสือ (ว) มีหลายฉบับในไฟล์เดียว ใช้ฉบับแรก
    starts = [i for i, x in enumerate(body) if squash(x).startswith('ที่ อว')]
    end = starts[1] if first_only and len(starts) > 1 else len(body)
    b = body[starts[0]:end]
    first = b[0].split('\t')
    address = [squash(first[-1])] if len(first) > 1 else []
    k = 1
    while k < len(b) and not re.match(r'^\s*[0-9๐-๙]+\s+[ก-๙]+\s+[0-9๐-๙]{4}\s*$', b[k]) and len(address) < 5:
        if squash(b[k]):
            address.append(squash(b[k]))
        k += 1
    # ย่อหน้าวันที่เป็นตัวหยุดที่อยู่
    idx = {}
    for i, x in enumerate(b):
        t = squash(x)
        for key in ('เรื่อง', 'เรียน', 'อ้างถึง', 'สิ่งที่ส่งมาด้วย', 'ขอแสดงความนับถือ'):
            if t.startswith(key) and key not in idx:
                idx[key] = i
    subject = strip_label(b[idx['เรื่อง']], 'เรื่อง')
    to = strip_label(b[idx['เรียน']], 'เรียน')
    ref = strip_label(b[idx['อ้างถึง']], 'อ้างถึง') if 'อ้างถึง' in idx else ''
    attachments = []
    if 'สิ่งที่ส่งมาด้วย' in idx:
        j = idx['สิ่งที่ส่งมาด้วย']
        while j < len(b) and squash(b[j]) and (j == idx['สิ่งที่ส่งมาด้วย'] or re.match(r'^\s*[0-9๐-๙]+\s*\.', squash(b[j]))):
            t = strip_label(b[j], 'สิ่งที่ส่งมาด้วย')
            t = re.sub(r'^[0-9๐-๙]+\s*\.\s*', '', t)
            t = re.sub(r'\s*(จำนวน\s*[0-9๐-๙]+\s*[ก-๙]+)$', r'  \1', t)
            attachments.append(t)
            j += 1
    body_start = max([v for k, v in idx.items() if k in ('เรื่อง', 'เรียน', 'อ้างถึง')] + [0]) + 1
    if 'สิ่งที่ส่งมาด้วย' in idx:
        body_start = max(body_start, idx['สิ่งที่ส่งมาด้วย'] + len(attachments))
    end_i = idx['ขอแสดงความนับถือ']
    paras = [squash(x) for x in b[body_start:end_i] if squash(x)]
    name, position, after = signature(b, end_i)
    tail = [squash(x) for x in b[after:] if squash(x)]
    coordinator = '\n'.join(tail)
    return dict(officeAddress='\n'.join(address), to=to, subject=subject, referenceDoc=ref,
                attachmentsText='\n'.join(attachments), bodyText='\n\n'.join(paras),
                coordinatorInfo=coordinator, signatoryName=name, signatoryPosition=position)


def order(path):
    _, body = load(path, page_breaks=True)
    b = [x for x in body if x.strip()]
    org_i = next(i for i, x in enumerate(b) if squash(x).startswith('คำสั่ง'))
    frm = strip_label(b[org_i], 'คำสั่ง')
    subj, k = [], org_i + 1
    while k < len(b) and not squash(b[k]).startswith('...'):
        t = squash(b[k])
        if not t.startswith('ที่ '):
            # เก็บการขึ้นบรรทัดใหม่ (Shift+Enter) ของต้นฉบับไว้ ไม่เช่นนั้นเบราว์เซอร์จะตัดคำเองต่างจาก Word
            parts = [squash(x) for x in b[k].split('\n') if x.strip()]
            parts[0] = strip_label(parts[0], 'เรื่อง')
            subj.append('\n'.join(parts))
        k += 1
    blocks, group = [], []

    def flush():
        nonlocal group
        if group:
            blocks.append('\n'.join(group))
            group = []

    for x in b[k + 1:]:
        t = squash(x)
        if t.startswith('สั่ง ณ วันที่'):
            break
        if x.startswith('\t'):
            parts = [p.strip() for p in x.split('\t') if p.strip()]
            if len(parts) >= 2 and parts[-1] in ROLES:
                line = ' '.join(parts[:-1]) + '  ' + parts[-1]
            else:
                line = ' '.join(parts)
            line = re.sub(r'\s+', ' ', line) if parts[-1] not in ROLES else re.sub(r'\s+(?=' + '|'.join(ROLES) + r'$)', '  ', re.sub(r'\s+', ' ', line))
            if re.match(r'^[๐-๙0-9]+\s*\.\s*คณะกรรมการ', line):
                flush()
            group.append(line)
        else:
            flush()
            blocks.append(t)
    flush()
    name, position, _ = signature(b, 0)
    return dict(**{'from': frm}, to='-', subject='\n'.join(subj), bodyText='\n\n'.join(blocks),
                signatoryName=name, signatoryPosition=position)


BUILDERS = {
    'memo': memo,
    'memo_circular': memo,
    'external': letter,
    'external_circular': lambda p: letter(p, first_only=True),
    'order': order,
}

result = {}
for cat, (title, rel) in FILES.items():
    preset = BUILDERS[cat](f'{ROOT}/{rel}')
    result[cat] = {'category': cat, 'title': title, 'sourceFile': rel.split('/')[-1], 'preset': preset}
json.dump(result, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=2)
print('ok', list(result))
