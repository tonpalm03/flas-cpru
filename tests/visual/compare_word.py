"""เทียบ Word ที่ระบบสร้างกับไฟล์ต้นฉบับ ผ่าน LibreOffice แล้วตรวจขอบซ้าย/ขวาของเนื้อหา

ใช้: python tests/visual/compare_word.py <ต้นฉบับ_dir> <ours_dir> <out_dir>
  ต้นฉบับ_dir ต้องมีไฟล์ real-memo-01.docx, real-order-02.docx, real-ext-circ-03.docx,
  real-ext-04.docx, real-memo-05.docx  (ชื่อตรงกับที่ dump-word.cjs สร้าง)
ต้องมี LibreOffice และฟอนต์ TH SarabunPSK ติดตั้งในเครื่อง และ pip install pymupdf
นอกจาก Word ยังพิมพ์ HTML Preview (ไฟล์ .html ใน ours_dir) เป็น PDF ด้วย Chrome แล้วเทียบแบบเดียวกัน
ออก exit code 1 ถ้าขอบซ้าย/ขวา หรือตำแหน่งบรรทัดแรกของเนื้อหาหน้าแรกต่างจากต้นฉบับเกิน TOL_MM
"""
import glob, os, re, shutil, subprocess, sys, zipfile
import fitz

TOL_MM = 6.0
CHROME = os.environ.get('CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
SOFFICE = os.environ.get('SOFFICE', r'C:\Program Files\LibreOffice\program\soffice.exe')
NAMES = ['memo-01', 'order-02', 'ext-circ-03', 'ext-04', 'memo-05']


def swap_font(src, dst):
    """ต้นฉบับใช้ TH SarabunIT๙ ให้สลับเป็น PSK เฉพาะตอนเรนเดอร์เทียบ"""
    zi = zipfile.ZipFile(src)
    zo = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for it in zi.infolist():
        d = zi.read(it.filename)
        if it.filename.endswith('.xml'):
            d = d.decode('utf8').replace('TH SarabunIT๙', 'TH SarabunPSK').encode('utf8')
        zo.writestr(it, d)
    zo.close()


def to_pdf(files, outdir):
    os.makedirs(outdir, exist_ok=True)
    subprocess.run([SOFFICE, '--headless', '--convert-to', 'pdf', '--outdir', outdir, *files],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def text_extent_mm(page):
    blocks = [b for b in page.get_text('blocks') if b[4].strip()]
    mm = 25.4 / 72
    return min(b[0] for b in blocks) * mm, (page.rect.width - max(b[2] for b in blocks)) * mm


def html_to_pdf(ours_dir, out_dir):
    os.makedirs(os.path.join(out_dir, 'pdf_html'), exist_ok=True)
    for n in NAMES:
        src = os.path.abspath(os.path.join(ours_dir, f'real-{n}.html'))
        dst = os.path.abspath(os.path.join(out_dir, 'pdf_html', f'real-{n}.pdf'))
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer',
                        f'--print-to-pdf={dst}', 'file:///' + src.replace(os.sep, '/')],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def first_text_top_mm(page):
    blocks = [b for b in page.get_text('blocks') if b[4].strip()]
    return min(b[1] for b in blocks) * 25.4 / 72


def main(orig_dir, ours_dir, out_dir):
    tmp = os.path.join(out_dir, '_orig_psk')
    os.makedirs(tmp, exist_ok=True)
    for n in NAMES:
        swap_font(os.path.join(orig_dir, f'real-{n}.docx'), os.path.join(tmp, f'real-{n}.docx'))
    to_pdf(sorted(glob.glob(os.path.join(tmp, '*.docx'))), os.path.join(out_dir, 'pdf_orig'))
    # ไฟล์ที่ระบบสร้างจากแม่แบบต้นฉบับใช้ TH SarabunIT๙ เช่นเดียวกับต้นฉบับ สลับเป็น PSK ตอนเรนเดอร์เทียบเหมือนกัน
    ours_tmp = os.path.join(out_dir, '_ours_psk')
    os.makedirs(ours_tmp, exist_ok=True)
    for f in glob.glob(os.path.join(ours_dir, '*.docx')):
        swap_font(f, os.path.join(ours_tmp, os.path.basename(f)))
    to_pdf(sorted(glob.glob(os.path.join(ours_tmp, '*.docx'))), os.path.join(out_dir, 'pdf_ours'))
    html_to_pdf(ours_dir, out_dir)
    failed = False
    for n in NAMES:
        a = fitz.open(os.path.join(out_dir, 'pdf_orig', f'real-{n}.pdf'))[0]
        b = fitz.open(os.path.join(out_dir, 'pdf_ours', f'real-{n}.pdf'))[0]
        al, ar = text_extent_mm(a)
        bl, br = text_extent_mm(b)
        ok = abs(al - bl) <= TOL_MM and abs(ar - br) <= TOL_MM
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'} {n}: left orig {al:.1f} ours {bl:.1f} mm | right orig {ar:.1f} ours {br:.1f} mm")
        h = fitz.open(os.path.join(out_dir, 'pdf_html', f'real-{n}.pdf'))[0]
        hl, hr = text_extent_mm(h)
        top_a, top_h = first_text_top_mm(a), first_text_top_mm(h)
        hok = abs(al - hl) <= TOL_MM and abs(ar - hr) <= TOL_MM and abs(top_a - top_h) <= TOL_MM
        failed |= not hok
        print(f"{'PASS' if hok else 'FAIL'} {n} [html]: left {hl:.1f}/{al:.1f} right {hr:.1f}/{ar:.1f} first-text-top {top_h:.1f}/{top_a:.1f} mm")
        pa, pb = a.get_pixmap(dpi=80), b.get_pixmap(dpi=80)
        out = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, pa.width + pb.width + 10, max(pa.height, pb.height)), False)
        out.clear_with(200)
        pb.set_origin(pa.width + 10, 0)
        out.copy(pa, pa.irect)
        out.copy(pb, pb.irect)
        out.save(os.path.join(out_dir, f'compare_{n}.png'))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main(*sys.argv[1:4])
