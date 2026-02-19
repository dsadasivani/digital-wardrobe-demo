param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [string]$Token = $env:ADMIN_JWT,
    [int]$BatchSize = 25,
    [int]$MaxUsers = 0,
    [switch]$DryRun,
    [string]$Cursor = "",
    [int]$MaxBatches = 0,
    [int]$TimeoutSec = 120
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "Missing admin JWT. Provide -Token or set ADMIN_JWT environment variable."
}
if ($BatchSize -le 0) {
    throw "BatchSize must be > 0."
}
if ($MaxUsers -lt 0) {
    throw "MaxUsers cannot be negative."
}
if ($MaxBatches -lt 0) {
    throw "MaxBatches cannot be negative."
}
if ($TimeoutSec -le 0) {
    throw "TimeoutSec must be > 0."
}

$endpoint = "$($BaseUrl.TrimEnd('/'))/media/images/thumbnails/backfill/admin"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$cursorValue = if ([string]::IsNullOrWhiteSpace($Cursor)) { $null } else { $Cursor.Trim() }
$batchIndex = 0

$totalProcessedUsers = 0
$totalWardrobeItemsScanned = 0
$totalAccessoriesScanned = 0
$totalUniqueSourcePaths = 0
$totalThumbnailsCreated = 0
$totalThumbnailsWouldCreate = 0
$totalThumbnailsAlreadyPresent = 0
$totalSkippedNotEligible = 0
$totalSkippedMissingSource = 0
$totalFailed = 0

Write-Host "Starting admin thumbnail backfill run"
Write-Host "Endpoint: $endpoint"
Write-Host "DryRun: $([bool]$DryRun), BatchSize: $BatchSize, MaxUsers: $MaxUsers, MaxBatches: $MaxBatches"

while ($true) {
    if ($MaxBatches -gt 0 -and $batchIndex -ge $MaxBatches) {
        Write-Host "Stopping because MaxBatches limit reached."
        break
    }

    $requestBody = @{
        batchSize = $BatchSize
        dryRun = [bool]$DryRun
    }
    if ($MaxUsers -gt 0) {
        $requestBody.maxUsers = $MaxUsers
    }
    if (-not [string]::IsNullOrWhiteSpace($cursorValue)) {
        $requestBody.cursor = $cursorValue
    }

    $requestJson = $requestBody | ConvertTo-Json -Compress
    $batchLabel = $batchIndex + 1
    Write-Host "Executing batch #$batchLabel ..."

    try {
        $response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -Body $requestJson -TimeoutSec $TimeoutSec
    } catch {
        Write-Error "Batch #$batchLabel failed. $($_.Exception.Message)"
        throw
    }

    $processedUsers = [int]$response.processedUsers
    $totalProcessedUsers += $processedUsers
    $totalWardrobeItemsScanned += [long]$response.wardrobeItemsScanned
    $totalAccessoriesScanned += [long]$response.accessoriesScanned
    $totalUniqueSourcePaths += [int]$response.uniqueSourcePaths
    $totalThumbnailsCreated += [int]$response.thumbnailsCreated
    $totalThumbnailsWouldCreate += [int]$response.thumbnailsWouldCreate
    $totalThumbnailsAlreadyPresent += [int]$response.thumbnailsAlreadyPresent
    $totalSkippedNotEligible += [int]$response.skippedNotEligible
    $totalSkippedMissingSource += [int]$response.skippedMissingSource
    $totalFailed += [int]$response.failed

    $hasMore = [bool]$response.hasMore
    $nextCursor = [string]$response.nextCursor

    Write-Host ("Batch #{0} result: users={1}, created={2}, wouldCreate={3}, alreadyPresent={4}, hasMore={5}" -f `
            $batchLabel, `
            $processedUsers, `
            [int]$response.thumbnailsCreated, `
            [int]$response.thumbnailsWouldCreate, `
            [int]$response.thumbnailsAlreadyPresent, `
            $hasMore)

    $batchIndex++
    if (-not $hasMore) {
        Write-Host "No more users to process."
        break
    }
    if ($processedUsers -le 0) {
        Write-Warning "hasMore=true but processedUsers=0; stopping to avoid infinite loop."
        break
    }
    if ([string]::IsNullOrWhiteSpace($nextCursor)) {
        Write-Warning "hasMore=true but nextCursor is empty; stopping to avoid infinite loop."
        break
    }

    $cursorValue = $nextCursor
}

Write-Host ""
Write-Host "Backfill run complete."
$summary = [ordered]@{
    dryRun = [bool]$DryRun
    batchesExecuted = $batchIndex
    processedUsers = $totalProcessedUsers
    wardrobeItemsScanned = $totalWardrobeItemsScanned
    accessoriesScanned = $totalAccessoriesScanned
    uniqueSourcePaths = $totalUniqueSourcePaths
    thumbnailsCreated = $totalThumbnailsCreated
    thumbnailsWouldCreate = $totalThumbnailsWouldCreate
    thumbnailsAlreadyPresent = $totalThumbnailsAlreadyPresent
    skippedNotEligible = $totalSkippedNotEligible
    skippedMissingSource = $totalSkippedMissingSource
    failed = $totalFailed
    nextCursor = $cursorValue
}

$summary | ConvertTo-Json
