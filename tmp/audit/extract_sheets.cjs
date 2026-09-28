const fs=require('fs');
const XLSX=require('xlsx');
const sources=JSON.parse(fs.readFileSync('tmp/audit/sources.json','utf8'));
for(const r of sources.filter(r=>['.xls','.xlsx'].includes(r.extension))){
  try{
    const wb=XLSX.readFile(r.path,{cellFormula:true});
    r.sheets=wb.SheetNames.map(name=>{
      const ws=wb.Sheets[name];
      const cells=Object.entries(ws).filter(([key])=>!key.startsWith('!'));
      return {name,range:ws['!ref'],formulaCount:cells.filter(([,v])=>v.f).length,
        samples:cells.filter(([,v])=>typeof v.v==='string').slice(0,100).map(([address,v])=>({address,text:v.v})),
        formulas:cells.filter(([,v])=>v.f).slice(0,12).map(([address,v])=>({address,formula:v.f}))};
    });
    r.status='extracted_spreadsheet';
  }catch(e){r.status='extraction_error';r.error=e.message;}
}
fs.writeFileSync('tmp/audit/sources.json',JSON.stringify(sources,null,2));
console.log(JSON.stringify(sources.filter(r=>r.sheets).map(r=>({path:r.path,sheets:r.sheets.map(s=>({name:s.name,range:s.range,formulas:s.formulaCount}))})),null,2));
