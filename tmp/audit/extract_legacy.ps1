$ErrorActionPreference = 'Stop'
$auditRoot = (Get-Location).Path
$auditSources = Get-Content -LiteralPath 'tmp/audit/sources.json' -Raw -Encoding utf8 | ConvertFrom-Json
$auditWord = New-Object -ComObject Word.Application
$auditWord.Visible = $false
$auditWord.DisplayAlerts = 0
$auditWord.AutomationSecurity = 3
try {
  foreach ($auditSource in ($auditSources | Where-Object extension -eq '.doc')) {
    $auditDoc = $null
    try {
      $auditPath = Join-Path $auditRoot $auditSource.path
      $auditDoc = $auditWord.Documents.Open($auditPath, $false, $true, $false)
      $auditSource | Add-Member -NotePropertyName text -NotePropertyValue $auditDoc.Content.Text -Force
      $auditSource.status = 'extracted_legacy_doc'
      $auditSource.PSObject.Properties.Remove('error')
    } catch {
      $auditSource.status = 'legacy_doc_needs_conversion'
      $auditSource | Add-Member -NotePropertyName error -NotePropertyValue $_.Exception.Message -Force
    } finally {
      if ($null -ne $auditDoc) { $auditDoc.Close(0) }
    }
  }
} finally { $auditWord.Quit(0) }
$auditSources | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath 'tmp/audit/sources.json' -Encoding utf8
$auditSources | Group-Object status | Select-Object Count,Name
