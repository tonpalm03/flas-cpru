"""สร้างแม่แบบ Word (.docx) แบบมีแท็ก จากไฟล์ต้นฉบับของคณะ ทั้ง 5 ประเภท

ใช้ส่วนหัว/ส่วนท้าย ตราครุฑ ฟอนต์ และการตั้งค่าหน้ากระดาษของไฟล์ต้นฉบับโดยตรง
- บันทึกข้อความ / (ว): แทนค่าหัวเรื่อง (ส่วนราชการ ที่ วันที่ เรื่อง) ในส่วนหัวด้วยแท็ก {{...}}
  ครุฑ+หัวเรื่องแสดงเฉพาะหน้าแรกของแต่ละฉบับ (titlePg) แต่ละผู้รับเป็นหนึ่งส่วน (section)
- หนังสือภายนอก / (ว) / คำสั่ง: เก็บย่อหน้านำหน้า (ตราครุฑลอยและบรรทัดว่างตามต้นฉบับ) แล้วต่อด้วยเนื้อหา {{@content}}
  แต่ละฉบับ (ผู้รับ) เป็นลูป {{#letters}} คั่นด้วยการขึ้นหน้าใหม่

ใช้: python make_word_templates.py <โฟลเดอร์ธุระการ> <โฟลเดอร์ปลายทาง>
"""
import os
import re
import sys
import zipfile

ROOT, OUT = sys.argv[1], sys.argv[2]
A4 = '<w:pgSz w:w="11906" w:h="16838"/>'
LETTER = '<w:pgSz w:w="12240" w:h="15840"/>'  # บันทึกข้อความของคณะตั้งกระดาษ Letter ตามต้นฉบับ
FONT = '<w:rFonts w:ascii="TH SarabunIT๙" w:hAnsi="TH SarabunIT๙" w:cs="TH SarabunIT๙"/>'
BOTTOM = 1134  # ขอบล่างคง 2.0 ซม. ตามที่ตกลง

SOURCES = {
    'memo': 'บันทึกข้อความ/1741  เชิญผู้เชี่ยวชาญ.docx',
    'memo_circular': 'บักทึกข้อความ ( ว )/ว 721.docx',
    'external': 'หนังสือภายนอก/864 ตอบรับการเผยแพร่ผลงาน.docx',
    'external_circular': 'หนังสือภายนอก (ว)/ว 520 เชิญวิทยากร.docx',
    'order': 'คำสั่ง/70 คำสั่งคณะกรรมการดำเนินงาน 3 สาขาวิชา.docx',
}


# ---------------------------------------------------------------- ตัวช่วยอ่านรัน
def runs_of(p):
    return list(re.finditer(r'<w:r(?: [^>]*)?>.*?</w:r>', p, re.S))


def text_of(r):
    return ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', r))


def has_tab(r):
    return '<w:tab/>' in r


def rpr_of(r):
    m = re.search(r'<w:rPr>.*?</w:rPr>', r, re.S)
    return m.group(0) if m else ''


def tag_run(rpr, tag):
    return f'<w:r>{rpr}<w:t xml:space="preserve">{{{{{tag}}}}}</w:t></w:r>'


def value_span(rs, label_idx):
    """ช่วงรันของค่า: ถัดจากป้าย+ช่องว่าง/แท็บ ไปจนถึงรันแท็บถัดไป"""
    i = label_idx + 1
    while i < len(rs) and not text_of(rs[i].group(0)).strip():
        i += 1
    j = i
    while j < len(rs) and not has_tab(rs[j].group(0)):
        j += 1
    return i, j


def rebuild(p, parts, tabs):
    """สร้างย่อหน้าหัวเรื่องใหม่: ป้าย + ช่องว่าง + ค่า (แท็ก) + แท็บเติมเส้นประเดียว
    แท็บส่วนเกินของต้นฉบับ (ใช้พอดีกับข้อความตัวอย่างยาว ๆ) ถูกตัดออก ไม่เช่นนั้นข้อความสั้นจะเกิดบรรทัดเส้นประเกิน"""
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', p, re.S).group(0)
    tab_xml = '<w:tabs>' + ''.join(f'<w:tab w:val="left" w:pos="{t}"/>' for t in tabs) + '</w:tabs>'
    ppr = re.sub(r'<w:tabs>.*?</w:tabs>', '', ppr, flags=re.S).replace('<w:pPr>', '<w:pPr>' + tab_xml, 1)
    return '<w:p>' + ppr + ''.join(parts) + '</w:p>'


GAP = '<w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">  </w:t></w:r>'


def small(rpr):
    """ตัดขนาดตัวอักษรออกเพื่อใช้ขนาดเริ่มต้นของเอกสาร (11 พอยต์) เหมือนรันแท็บเติมเส้นประของต้นฉบับ
    เส้นประของรันเล็กอยู่ชิดตัวอักษรและจุดถี่ ถ้าใช้ 16 พอยต์ จุดจะห่างและเส้นต่ำลง"""
    return re.sub(r'<w:sz w:val="\d+"/>|<w:szCs w:val="\d+"/>', '', rpr)


def tab_run(rpr, tiny=True):
    return f'<w:r>{small(rpr) if tiny else rpr}<w:tab/></w:r>'


def build_header(h, fill=9070):
    """ช่องว่างหลังป้ายหัวข้อ (ส่วนราชการ/ที่/วันที่/เรื่อง) ใช้รันของต้นฉบับตามเดิม เพื่อให้ระยะเว้นวรรคเท่าต้นฉบับ"""
    out = h
    done = 0
    for m in reversed(list(re.finditer(r'<w:p[ >].*?</w:p>', h, re.S))):
        p = m.group(0)
        rs = runs_of(p)
        texts = [text_of(r.group(0)).strip() for r in rs]
        gap = lambda a, b: [r.group(0) for r in rs[a:b]]
        new = None
        if texts and texts[0] == 'ส่วนราชการ':
            a, _ = value_span(rs, 0)
            vr = rpr_of(rs[a].group(0))
            new = rebuild(p, [rs[0].group(0), *gap(1, a), tag_run(vr, 'from'), tab_run(vr)], [fill])
        elif texts and texts[0] == 'ที่':
            d = next(i for i, t in enumerate(texts) if t == 'วันที่')
            na, _ = value_span(rs, 0)
            da, _ = value_span(rs, d)
            nr, dr = rpr_of(rs[na].group(0)), rpr_of(rs[da].group(0))
            new = rebuild(p, [rs[0].group(0), *gap(1, na), tag_run(nr, 'docNumber'), tab_run(nr), rs[d].group(0), *gap(d + 1, da), tag_run(dr, 'date'), tab_run(dr)], [3960, fill])
        elif texts and texts[0] == 'เรื่อง':
            a, _ = value_span(rs, 0)
            vr = rpr_of(rs[a].group(0))
            new = rebuild(p, [rs[0].group(0), *gap(1, a), tag_run(vr, 'subject'), tab_run(vr, tiny=False)], [720, fill])
        if new:
            out = out[:m.start()] + new + out[m.end():]
            done += 1
    assert done == 3, f'พบย่อหน้าหัวเรื่องไม่ครบ ({done}/3)'
    return out


# ---------------------------------------------------------------- เนื้อหา
def para(ppr, inner):
    return f'<w:p><w:pPr>{ppr}</w:pPr>{inner}</w:p>'


def tag_para(tag):
    return f'<w:p><w:r><w:t xml:space="preserve">{{{{{tag}}}}}</w:t></w:r></w:p>'


def memo_body(sect_break):
    run = lambda t: f'<w:r><w:rPr>{FONT}<w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r>'
    tab = f'<w:r><w:rPr>{FONT}<w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:tab/></w:r>'
    to = para('<w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/>',
              run('เรียน') + tab + run('{{to}}'))
    return (tag_para('#letters') + to + ''.join(tag_para('@' + t) for t in ('extra', 'body', 'signature', 'coordinator'))
            + tag_para('#notLast') + sect_break + tag_para('/notLast') + tag_para('/letters'))


def add_part(zin_files, name, data, content_type, rel_type, rel_id):
    """เพิ่มไฟล์ส่วนหัว/ท้าย พร้อมความสัมพันธ์และประเภทเนื้อหา"""
    zin_files[f'word/{name}'] = data
    rels = zin_files['word/_rels/document.xml.rels'].decode('utf8')
    rels = rels.replace('</Relationships>', f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/{rel_type}" Target="{name}"/></Relationships>')
    zin_files['word/_rels/document.xml.rels'] = rels.encode('utf8')
    ct = zin_files['[Content_Types].xml'].decode('utf8')
    ct = ct.replace('</Types>', f'<Override PartName="/word/{name}" ContentType="{content_type}"/></Types>')
    zin_files['[Content_Types].xml'] = ct.encode('utf8')


def memo_template(src, dst, paper=A4, fill=9070):
    zin = zipfile.ZipFile(src)
    files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
    infos = {i.filename: i for i in zin.infolist()}
    doc = files['word/document.xml'].decode('utf8')
    sect = re.findall(r'<w:sectPr.*?</w:sectPr>', doc, re.S)[-1]
    sect = re.sub(r'<w:pgSz[^>]*/>', paper, sect)
    hdr_ref = re.search(r'<w:headerReference w:type="default" r:id="(\w+)"/>', sect)
    ftr_ref = re.search(r'<w:footerReference w:type="default" r:id="(\w+)"/>', sect)
    # ส่วนหัวต้นฉบับ (ครุฑ+หัวเรื่อง) แสดงเฉพาะหน้าแรก หน้าถัดไปใช้ส่วนหัวว่าง ขอบบนหน้าถัดไปตามต้นฉบับ
    hdr_name = next(n for n in files if re.match(r'word/header\d*\.xml', n))
    hdr_xml = files[hdr_name].decode('utf8')
    empty = re.sub(r'(<w:hdr[^>]*>).*(</w:hdr>)', r'\1<w:p/>\2', hdr_xml, flags=re.S)
    add_part(files, 'headerBlank.xml', empty.encode('utf8'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml', 'header', 'rIdHdrBlank')
    sect = sect.replace(hdr_ref.group(0), '<w:headerReference w:type="default" r:id="rIdHdrBlank"/><w:headerReference w:type="first" r:id="%s"/>' % hdr_ref.group(1))
    if ftr_ref:
        ftr_name = next(n for n in files if re.match(r'word/footer\d*\.xml', n))
        add_part(files, 'footerFirst.xml', files[ftr_name], 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml', 'footer', 'rIdFtrFirst')
        sect = sect.replace(ftr_ref.group(0), ftr_ref.group(0) + '<w:footerReference w:type="first" r:id="rIdFtrFirst"/>')
    sect = sect.replace('<w:docGrid', '<w:titlePg/><w:docGrid', 1)
    head = doc[:doc.index('<w:body>') + len('<w:body>')]
    sect_break = '<w:p><w:pPr>' + sect + '</w:pPr></w:p>'
    files['word/document.xml'] = (head + memo_body(sect_break) + sect + '</w:body></w:document>').encode('utf8')
    files[hdr_name] = build_header(hdr_xml, fill).encode('utf8')
    write(dst, files, infos)


def leading_template(src, dst, first_text, pgmar_bottom=True):
    """เก็บย่อหน้านำหน้า (ตราครุฑลอย + บรรทัดว่าง) ของต้นฉบับ แล้วต่อด้วย {{@content}} ในลูปต่อฉบับ"""
    zin = zipfile.ZipFile(src)
    files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
    infos = {i.filename: i for i in zin.infolist()}
    doc = files['word/document.xml'].decode('utf8')
    body = re.search(r'<w:body>(.*)</w:body>', doc, re.S).group(1)
    sect = re.findall(r'<w:sectPr.*?</w:sectPr>', body, re.S)[-1]
    paras = re.findall(r'<w:p[ >].*?</w:p>', body.replace(sect, ''), re.S)
    k = next(i for i, p in enumerate(paras) if re.sub(r'\s+', ' ', ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))).strip().startswith(first_text))
    leading = ''.join(paras[:k])
    sect = re.sub(r'<w:pgSz[^>]*/>', A4, sect)
    if pgmar_bottom:
        sect = re.sub(r'(<w:pgMar[^>]*w:bottom=")\d+(")', rf'\g<1>{BOTTOM}\2', sect)
    head = doc[:doc.index('<w:body>') + len('<w:body>')]
    new = head + tag_para('#letters') + leading + tag_para('@content') + tag_para('@pageBreak') + tag_para('/letters') + sect + '</w:body></w:document>'
    files['word/document.xml'] = new.encode('utf8')
    write(dst, files, infos)


def write(dst, files, infos):
    z = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for name, data in files.items():
        if name in infos:
            z.writestr(infos[name], data)
        else:
            z.writestr(name, data)
    z.close()


os.makedirs(OUT, exist_ok=True)
memo_template(f'{ROOT}/{SOURCES["memo"]}', f'{OUT}/memo.docx', LETTER, 9360)  # ตรงกับ headerFillTwips ใน lib/adminTemplateSpec.ts
memo_template(f'{ROOT}/{SOURCES["memo_circular"]}', f'{OUT}/memo_circular.docx')
leading_template(f'{ROOT}/{SOURCES["external"]}', f'{OUT}/external.docx', 'ที่ อว')
leading_template(f'{ROOT}/{SOURCES["external_circular"]}', f'{OUT}/external_circular.docx', 'ที่ อว')
leading_template(f'{ROOT}/{SOURCES["order"]}', f'{OUT}/order.docx', 'คำสั่ง', pgmar_bottom=False)
print('ok', sorted(os.listdir(OUT)))
