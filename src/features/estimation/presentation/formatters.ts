import Decimal from "decimal.js";

const integerFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 0,
});

const moneyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei",
});

function finiteDecimal(value: string): Decimal | null {
  try {
    const decimal = new Decimal(value);
    return decimal.isFinite() ? decimal : null;
  } catch {
    return null;
  }
}

function formatDecimalExactly(
  decimal: Decimal,
  maximumFractionDigits: number,
  minimumFractionDigits = 0,
): string {
  const rounded = decimal.toDecimalPlaces(
    maximumFractionDigits,
    Decimal.ROUND_HALF_UP,
  );
  const fixed = rounded.toFixed(maximumFractionDigits);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [integer = "0", fraction = ""] = unsigned.split(".");
  const retainedFraction = fraction
    .slice(
      0,
      Math.max(minimumFractionDigits, fraction.replace(/0+$/u, "").length),
    )
    .padEnd(minimumFractionDigits, "0");
  const grouped = integerFormatter.format(BigInt(integer));

  return `${negative ? "-" : ""}${grouped}${
    retainedFraction ? `.${retainedFraction}` : ""
  }`;
}

export function formatEffort(value: string): string {
  const decimal = finiteDecimal(value);
  return decimal === null
    ? "無法顯示"
    : `${formatDecimalExactly(decimal, 1, 1)} 小時`;
}

export function formatMoney(value: string): string {
  const decimal = finiteDecimal(value);
  if (decimal === null) {
    return "無法顯示";
  }
  const rounded = decimal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0);
  return moneyFormatter.format(BigInt(rounded));
}

export function formatRatio(value: string | null): string {
  if (value === null) {
    return "無法計算";
  }
  const decimal = finiteDecimal(value);
  return decimal === null
    ? "無法計算"
    : `${formatDecimalExactly(decimal.times(100), 1, 1)}%`;
}

export function formatDecimal(value: string, digits = 2): string {
  const decimal = finiteDecimal(value);
  if (decimal === null) {
    return "無法顯示";
  }
  return formatDecimalExactly(decimal, digits);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "時間無法顯示"
    : dateFormatter.format(date);
}

export function ratioToPercentInput(value: string): string {
  try {
    return new Decimal(value).mul(100).toString();
  } catch {
    return "";
  }
}

export function percentInputToRatio(value: string): string {
  if (value.trim() === "") {
    return "";
  }
  try {
    return new Decimal(value).div(100).toString();
  } catch {
    return value;
  }
}
