# Gera as miniaturas leves (320 px, JPEG) das ilustrações das ofertas.
# Uso (PowerShell, na pasta do projeto):  powershell -File tools/gerar_miniaturas.ps1
# Rode sempre que salvar uma ilustração nova em images/ofertas/<slug>.webp
Add-Type -AssemblyName PresentationCore
$origem = Join-Path $PSScriptRoot "..\images\ofertas"
$destino = Join-Path $origem "mini"
New-Item -ItemType Directory -Force $destino | Out-Null
Get-ChildItem $origem -Filter *.webp | ForEach-Object {
  $fs = [System.IO.File]::OpenRead($_.FullName)
  $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  $fs.Close()
  $quadro = $dec.Frames[0]
  $escala = 320 / [Math]::Max($quadro.PixelWidth, $quadro.PixelHeight)
  $menor = New-Object System.Windows.Media.Imaging.TransformedBitmap($quadro, (New-Object System.Windows.Media.ScaleTransform($escala, $escala)))
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 82
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($menor))
  $saida = [System.IO.File]::Create((Join-Path $destino ($_.BaseName + ".jpg")))
  $enc.Save($saida); $saida.Close()
  Write-Host "ok: $($_.BaseName)"
}
