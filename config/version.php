<?php

declare(strict_types=1);

/**
 * Fonte oficial da versão visível do AgendaPro.
 *
 * Atualize estes valores em toda entrega:
 * - correção compatível: PATCH;
 * - funcionalidade compatível: MINOR e zere PATCH;
 * - mudança incompatível: MAJOR e zere MINOR/PATCH;
 * - build: AAAAMMDD.N, aumentando N a cada publicação do mesmo dia.
 */
const APP_VERSION_MAJOR = 1;
const APP_VERSION_MINOR = 2;
const APP_VERSION_PATCH = 9;
const APP_BUILD_DATE = '20260918';
const APP_BUILD_NUMBER = 11;

function app_version(): string
{
    return sprintf('%d.%d.%d', APP_VERSION_MAJOR, APP_VERSION_MINOR, APP_VERSION_PATCH);
}

function app_build(): string
{
    return sprintf('%s.%d', APP_BUILD_DATE, APP_BUILD_NUMBER);
}

function app_version_label(?string $commitSha = null): string
{
    $label = sprintf('Versão %s · Build %s', app_version(), app_build());
    $shortCommit = $commitSha === null ? '' : substr(trim($commitSha), 0, 7);

    return $shortCommit === '' ? $label : sprintf('%s · %s', $label, $shortCommit);
}
