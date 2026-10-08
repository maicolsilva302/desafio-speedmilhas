export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

export const INICIAIS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

export function hojeIso(): string {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 10);
}

function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);

  return new Date(Date.UTC(ano, mes - 1, dia));
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

export function primeiroDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function mesmoMes(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function somarDias(iso: string, dias: number): string {
  const data = paraData(iso);

  data.setUTCDate(data.getUTCDate() + dias);

  return paraIso(data);
}

export function somarMeses(iso: string, meses: number): string {
  const data = paraData(iso);
  const alvo = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, 1));
  const dia = Math.min(
    data.getUTCDate(),
    diasNoMes(alvo.getUTCFullYear(), alvo.getUTCMonth()),
  );

  return paraIso(
    new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth(), dia)),
  );
}

export function gradeDoMes(iso: string): (string | null)[] {
  const primeiro = paraData(primeiroDoMes(iso));
  const deslocamento = primeiro.getUTCDay();
  const total = diasNoMes(primeiro.getUTCFullYear(), primeiro.getUTCMonth());
  const casas: (string | null)[] = new Array(42).fill(null);

  for (let dia = 1; dia <= total; dia += 1) {
    casas[deslocamento + dia - 1] = `${iso.slice(0, 7)}-${String(dia).padStart(2, '0')}`;
  }

  return casas;
}

export function rotuloMes(iso: string): string {
  const data = paraData(iso);

  return `${MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}

export function rotuloCurto(iso: string): string {
  const data = paraData(iso);

  return (
    `${DIAS_CURTOS[data.getUTCDay()]}, ${data.getUTCDate()} ` +
    `${MESES_CURTOS[data.getUTCMonth()]} ${data.getUTCFullYear()}`
  );
}

export function rotuloLongo(iso: string): string {
  const data = paraData(iso);

  return `${data.getUTCDate()} de ${MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}
