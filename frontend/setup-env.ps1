# Firebase プロジェクトの設定値を取得して .env.local を生成するスクリプト
# 実行前に: firebase login --reauth

$project = "mudai-notepad-bbs"

Write-Host "Getting Firebase web app config for $project ..."

# firebase apps:sdkconfig で config を取得
$raw = firebase apps:sdkconfig web --project $project 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Web app が見つかりません。作成します..."
    firebase apps:create web "mudai-notepad-bbs-web" --project $project
    $raw = firebase apps:sdkconfig web --project $project 2>&1
}

# JSON 部分だけ抽出
$json = ($raw | Select-String -Pattern '^\s*\{' -Context 0,30 | ForEach-Object { $_.Line }) -join "`n"

Write-Host "Raw config:"
Write-Host $raw

Write-Host ""
Write-Host "上記の値を確認して .env.local に貼り付けてください。"
Write-Host "テンプレート: .env.local.example"
