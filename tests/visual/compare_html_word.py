"""เทียบ Preview/PDF (HTML พิมพ์ด้วย Chrome) กับไฟล์ Word ที่ Microsoft Word ส่งออกเป็น PDF ทีละบรรทัด

ใช้: node tests/visual/dump-word.cjs <dir>            (สร้าง real-*.docx และ real-*.html)
     python tests/visual/compare_html_word.py <dir>   (ต้องมี Microsoft Word, Chrome และ pip install pymupdf)
ตั้ง DUMP_SIGNED=1 ตอนรัน dump-word.cjs เพื่อตรวจบล็อกลงนามแบบมีรูปลายเซ็น
ต้องติดตั้งฟอนต์ TH SarabunIT๙ ในเครื่อง ไม่เช่นนั้น Word จะใช้ฟอนต์อื่นและผลเทียบไม่มีความหมาย
ออก exit code 1 ถ้าบรรทัดใดใน Preview ต่างจาก Word เกิน TOL_MM ในแนวตั้ง หรือจำนวนหน้าไม่เท่ากัน
"""
import glob, os, subprocess, sys
import fitz

TOL_MM = 1.0
MM = 25.4 / 72
CHROME = os.environ.get('CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
NAMES = ['memo-01', 'memo-05', 'ext-04', 'ext-circ-03', 'order-02']


def word_to_pdf(files):
    """ส่งออก PDF ด้วย Microsoft Word ผ่าน COM (PowerShell)"""
    paths = ','.join("'" + os.path.abspath(f).replace("'", "''") + "'" for f in files)
    ps = (
        "$w = New-Object -ComObject Word.Application; $w.Visible = $false; $w.DisplayAlerts = 0; "
        f"try {{ foreach ($f in @({paths})) {{ $d = $w.Documents.Open($f, $false, $true); "
        "$d.ExportAsFixedFormat(($f -replace '\\.docx$', '.word.pdf'), 17); $d.Close(0) } } finally { $w.Quit() }"
    )
    subprocess.run(['powershell', '-NoProfile', '-Command', ps], check=True)


def html_to_pdf(src, dst):
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={dst}',
                    'file:///' + os.path.abspath(src).replace(os.sep, '/')],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def lines(page):
    """บรรทัดข้อความของหน้า: (บน, ซ้าย, ข้อความ) เป็นมิลลิเมตร ไม่นับช่องว่างนำหน้า"""
    by = {}
    for w in page.get_text('words'):
        by.setdefault((w[5], w[6]), []).append(w)
    return sorted((min(x[1] for x in v) * MM, min(x[0] for x in v) * MM, ' '.join(x[4] for x in v)) for v in by.values())


def main(folder):
    docs = [os.path.join(folder, f'real-{n}.docx') for n in NAMES]
    word_to_pdf(docs)
    failed = False
    for n in NAMES:
        word = fitz.open(os.path.join(folder, f'real-{n}.word.pdf'))
        html_pdf = os.path.join(folder, f'real-{n}.html.pdf')
        html_to_pdf(os.path.join(folder, f'real-{n}.html'), html_pdf)
        html = fitz.open(html_pdf)
        worst = 0.0
        if len(word) != len(html):
            failed = True
            print(f'FAIL {n}: pages word {len(word)} html {len(html)}')
        for wp, hp in zip(word, html):
            hl = lines(hp)
            used = set()
            for y, x, t in lines(wp):
                m = next((i for i, l in enumerate(hl) if i not in used and l[2][:6] == t[:6]), None)
                if m is None:
                    continue
                used.add(m)
                worst = max(worst, abs(hl[m][0] - y))
        ok = worst <= TOL_MM
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'} {n}: pages {len(word)} | worst line offset html vs word {worst:.1f} mm")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main(sys.argv[1])
