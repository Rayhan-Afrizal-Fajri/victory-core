export function formatNumber(value: any): string {
  const num = Number(value) || 0

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatCurrency(value: any): string {
  const num = Number(value) || 0

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDecimal(value: any): string {
    return parseFloat(value).toString();
}