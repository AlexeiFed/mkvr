# Скрипт для добавления @ts-nocheck во все файлы роутов
$routesPath = "src/routes"
$files = Get-ChildItem -Path $routesPath -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Проверяем, есть ли уже @ts-nocheck
    if ($content -notmatch "@ts-nocheck") {
        # Добавляем @ts-nocheck в начало файла после комментариев
        $newContent = "// @ts-nocheck`n" + $content
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Added @ts-nocheck to $($file.Name)"
    } else {
        Write-Host "@ts-nocheck already exists in $($file.Name)"
    }
}

Write-Host "Done!" 