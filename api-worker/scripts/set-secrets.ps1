Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^([^#].+?)=(.+)$') {
        $key = $matches[1]
        $value = $matches[2]
        Write-Host "Setting secret: $key"
        $value | & npx wrangler secret put $key
    }
}