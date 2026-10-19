"""สร้างแม่แบบ Word (.docx) แบบมีแท็ก จากไฟล์ต้นฉบับของคณะ

ใช้ส่วนหัว/ส่วนท้าย ตราครุฑ ฟอนต์ และการตั้งค่าหน้ากระดาษของไฟล์ต้นฉบับโดยตรง
แล้วแทนค่าที่เปลี่ยนตามเอกสาร (ส่วนราชการ ที่ วันที่ เรื่อง เรียน) ด้วยแท็ก {{...}}
ส่วนเนื้อหา/ผู้ลงนาม/ผู้ประสานงานเป็นแท็ก XML ({{@...}}) ที่ระบบสร้างให้ตอนส่งออก

ใช้: python make_word_templates.py <ต้นฉบับ.docx> <ปลายทาง.docx>
"""
import re
import sys
import zipfile

SRC, DST = sys.argv[1], sys.argv[2]
A4 = '<w:pgSz w:w="11906" w:h="16838"/>'
FONT = '<w:rFonts w:ascii="TH SarabunIT๙" w:hAnsi="TH SarabunIT๙" w:cs="TH SarabunIT๙"/>'


def runs_of(p):
    return [m for m in re.finditer(r'<w:r(?: [^>]*)?>.*?</w:r>', p, re.S)]


def text_of(r):
    return ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', r))


def has_tab(r):
    return '<w:tab/>' in r


def rpr_of(r):
    m = re.search(r'<w:rPr>.*?</w:rPr>', r, re.S)
    return m.group(0) if m else ''


def tag_run(rpr, tag):
    return f'<w:r>{rpr}<w:t xml:space="preserve">{{{{{tag}}}}}</w:t></w:r>'


def replace_range(p, start, end, tag):
    """แทนรัน [start, end) ของย่อหน้าด้วยรันเดียวที่เป็นแท็ก (ใช้รูปแบบตัวอักษรของรันแรกที่ถูกแทน)"""
    rs = runs_of(p)
    first, last = rs[start], rs[end - 1]
    return p[:first.start()] + tag_run(rpr_of(first.group(0)), tag) + p[last.end():]


def value_span(rs, label_idx):
    """ช่วงรันของค่า: ถัดจากป้าย+ช่องว่าง/แท็บ ไปจนถึงรันแท็บล้วนถัดไป"""
    i = label_idx + 1
    while i < len(rs) and not text_of(rs[i].group(0)).strip():
        i += 1
    j = i
    while j < len(rs) and not (has_tab(rs[j].group(0)) and not text_of(rs[j].group(0)).strip()) and not has_tab(rs[j].group(0)):
        j += 1
    return i, j


def rebuild(p, parts, tabs):
    """สร้างย่อหน้าหัวเรื่องใหม่จากรัน: ป้าย + ช่องว่าง + ค่า (แท็ก) + แท็บเติมเส้นประเดียว
    แท็บส่วนเกินของไฟล์ต้นฉบับ (ที่ใช้พอดีกับข้อความตัวอย่างยาว ๆ) ถูกตัดออก ไม่เช่นนั้นข้อความสั้นจะเกิดบรรทัดเส้นประเกิน"""
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', p, re.S).group(0)
    tab_xml = '<w:tabs>' + ''.join(f'<w:tab w:val="left" w:pos="{t}"/>' for t in tabs) + '</w:tabs>'
    ppr = re.sub(r'<w:tabs>.*?</w:tabs>', '', ppr, flags=re.S)
    ppr = ppr.replace('<w:pPr>', '<w:pPr>' + tab_xml, 1)
    return '<w:p>' + ppr + ''.join(parts) + '</w:p>'


GAP = '<w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">  </w:t></w:r>'


def tab_run(rpr):
    return f'<w:r>{rpr}<w:tab/></w:r>'


def build_header(h):
    out = h
    paras = list(re.finditer(r'<w:p[ >].*?</w:p>', h, re.S))
    done = 0
    for m in reversed(paras):
        p = m.group(0)
        rs = runs_of(p)
        texts = [text_of(r.group(0)).strip() for r in rs]
        new = None
        if texts and texts[0] == 'ส่วนราชการ':
            a, b = value_span(rs, 0)
            vr = rpr_of(rs[a].group(0))
            new = rebuild(p, [rs[0].group(0), GAP, tag_run(vr, 'from'), tab_run(vr)], [9070])
        elif texts and texts[0] == 'ที่':
            d = next(i for i, t in enumerate(texts) if t == 'วันที่')
            na, nb = value_span(rs, 0)
            da, db = value_span(rs, d)
            nr, dr = rpr_of(rs[na].group(0)), rpr_of(rs[da].group(0))
            new = rebuild(p, [rs[0].group(0), GAP, tag_run(nr, 'docNumber'), tab_run(nr), rs[d].group(0), GAP, tag_run(dr, 'date'), tab_run(dr)], [3960, 9070])
        elif texts and texts[0] == 'เรื่อง':
            a, b = value_span(rs, 0)
            vr = rpr_of(rs[a].group(0))
            new = rebuild(p, [rs[0].group(0), tab_run(rpr_of(rs[0].group(0))), tag_run(vr, 'subject'), tab_run(vr)], [720, 9070])
        if new:
            out = out[:m.start()] + new + out[m.end():]
            done += 1
    assert done == 3, f'พบย่อหน้าหัวเรื่องไม่ครบ ({done}/3)'
    return out


def para(ppr, inner):
    return f'<w:p><w:pPr>{ppr}</w:pPr>{inner}</w:p>'


def body_xml(sect):
    run = lambda t, extra='': f'<w:r><w:rPr>{FONT}{extra}<w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r>'
    tab = f'<w:r><w:rPr>{FONT}<w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:tab/></w:r>'
    to = para('<w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/>',
              run('เรียน') + tab + run('{{to}}'))
    tags = ''.join(para('<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>', run('{{@' + t + '}}')) for t in ('extra', 'body', 'signature', 'coordinator'))
    return to + tags + sect


def main():
    zin = zipfile.ZipFile(SRC)
    doc = zin.read('word/document.xml').decode('utf8')
    sect = re.findall(r'<w:sectPr.*?</w:sectPr>', doc, re.S)[-1]
    sect = re.sub(r'<w:pgSz[^>]*/>', A4, sect)
    head = doc[:doc.index('<w:body>') + len('<w:body>')]
    new_doc = head + body_xml(sect) + '</w:body></w:document>'
    zout = zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED)
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == 'word/document.xml':
            data = new_doc.encode('utf8')
        elif re.match(r'word/header\d*\.xml', item.filename):
            data = build_header(data.decode('utf8')).encode('utf8')
        zout.writestr(item, data)
    zout.close()
    print('ok', DST)


main()
