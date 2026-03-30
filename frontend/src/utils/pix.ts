export function buildPixQrUrl(pixKey: string, size = 240) {
  const normalizedKey = pixKey.trim();
  if (!normalizedKey) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    normalizedKey,
  )}`;
}

export async function copyPixKey(pixKey: string) {
  const normalizedKey = pixKey.trim();

  if (!normalizedKey) {
    throw new Error("Nenhuma chave Pix cadastrada para copiar.");
  }

  if (!navigator.clipboard?.writeText) {
    throw new Error("A copia da chave Pix nao esta disponivel neste aparelho.");
  }

  await navigator.clipboard.writeText(normalizedKey);
}
