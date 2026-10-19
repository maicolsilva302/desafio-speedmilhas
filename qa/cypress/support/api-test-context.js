export const apiTestContext = {
  query: null,
  searchResponse: null,
  quote: null,
  order: null,
  response: null,
  clients: null,
  orderRequest: null,
  secondOrder: null,
};

export function dateFromToday(offsetDays = 45) {
  const date = new Date();

  date.setDate(date.getDate() + offsetDays);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function uniqueFutureDate(offsetDays = 45) {
  const uniqueOffset = offsetDays + Math.floor(Math.random() * 300);

  return dateFromToday(uniqueOffset);
}

export function yesterdayIso() {
  return dateFromToday(-1);
}

export function uniqueIdempotencyKey() {
  return `qa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}