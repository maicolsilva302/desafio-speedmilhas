# Revisão do PR `feature/cupom-desconto`

<!-- Opcional se você comentou direto no PR. Separe o que bloqueia o merge do que é sugestão. -->

## Bloqueia o merge

- **[Bloqueador] A validade do cupom compara apenas o dia do mês.** Em `api/src/coupons/coupons.service.ts:15`, `getDate()` ignora mês, ano e horário. Por exemplo, `VERAO25` venceu em 31/03/2026, mas a validação com a data 15/10/2026 compara `31 < 15` e o considera válido. Isso contraria a regra do PR de expiração por `validUntil` e pode aplicar desconto a cupom vencido. Comparar a data/hora completa, mantendo o instante final inclusivo conforme a regra.

## Sugestões

- Ampliar os testes de `CouponsService` para cobrir vencimento em mês/ano diferentes e o limite exato de `validUntil` (instante igual ainda válido; instante posterior inválido). O teste atual de cupom vencido usa março contra outubro, mas a comparação apenas do dia do mês faz com que ele não passe como esperado.

## Veredito

**Solicito alterações antes do merge** por causa da validação incorreta de cupons vencidos. Revisão feita por inspeção do diff.
