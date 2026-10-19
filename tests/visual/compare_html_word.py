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
    # รอสคริปต์ในหน้า (วาดเส้นหัวบันทึกข้อความหลังโหลดฟอนต์) ก่อนพิมพ์
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=5000', f'--print-to-pdf={dst}',
                    'file:///' + os.path.abspath(src).replace(os.sep, '/')],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def words(page):
    """คำในหน้า: (บน, ซ้าย, ข้อความ) เป็นมิลลิเมตร เรียงจากบนลงล่าง ซ้ายไปขวา"""
    return sorted((w[1] * MM, w[0] * MM, w[4]) for w in page.get_text('words'))


def rule_rows(page):
    """ตำแหน่งแนวตั้ง (มม.) ของเส้นบาง ๆ ยาวในหัวเอกสาร (บน 62 มม.) รวมเส้นที่อยู่แถวเดียวกัน"""
    ys = []
    for d in page.get_drawings():
        for it in d['items']:
            r = it[1] if it[0] == 're' else (fitz.Rect(it[1], it[2]) if it[0] == 'l' else None)
            if r is not None and r.y0 * MM < 62 and r.height * MM < 1:
                ys.append((r.y0 + r.y1) / 2 * MM)
    rows = []
    for y in sorted(ys):
        if rows and y - rows[-1][-1] < 1.0:
            rows[-1].append(y)
        else:
            rows.append([y])
    return [round(sum(v) / len(v), 2) for v in rows if len(v) >= 5]


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
            # จับคู่คำที่เหมือนกันทุกตัวอักษร (คำที่ตัดบรรทัดต่างกันจะไม่ตรงกันและถูกข้าม)
            hw = words(hp)
            used = set()
            for y, x, t in words(wp):
                m = next((i for i, l in enumerate(hw) if i not in used and l[2] == t and abs(l[0] - y) < 5), None)
                if m is None:
                    continue
                used.add(m)
                worst = max(worst, abs(hw[m][0] - y))
        # เส้นหัวบันทึกข้อความ (เส้นเวกเตอร์ใน PDF ทั้งสองฝั่ง): ตำแหน่งแนวตั้งของทุกเส้นต้องตรงกับ Word
        if n.startswith('memo'):
            wl, hl2 = rule_rows(word[0]), rule_rows(html[0])
            if len(wl) != len(hl2):
                worst = max(worst, 99.0)
                print(f'      header lines word {wl} html {hl2}')
            else:
                worst = max([worst] + [abs(a - b) for a, b in zip(wl, hl2)])
        ok = worst <= TOL_MM
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'} {n}: pages {len(word)} | worst line offset html vs word {worst:.1f} mm")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main(sys.argv[1])
