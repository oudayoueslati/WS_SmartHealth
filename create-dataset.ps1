# Script pour créer le dataset SmartHealth dans Fuseki
$fusekiUrl = "http://localhost:3030"
$datasetName = "SmartHealth"

# Créer le dataset
$body = @{
    "dbType" = "tdb2"
    "dbName" = $datasetName
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$fusekiUrl/$/datasets" -Method Post -Body $body -ContentType "application/json" -Headers @{"Authorization"="Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))}
    Write-Host "✅ Dataset '$datasetName' créé avec succès!" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "ℹ️  Dataset '$datasetName' existe déjà" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}
