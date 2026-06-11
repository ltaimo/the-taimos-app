import assert from 'node:assert/strict';
import test from 'node:test';
import { monthEnd, monthStart, recurringDate } from './recurring-date';

test('normaliza qualquer data para o primeiro dia UTC do mês', () => {
  assert.equal(monthStart(new Date('2026-06-24T19:30:00Z')).toISOString(), '2026-06-01T00:00:00.000Z');
});

test('calcula o início do mês seguinte', () => {
  assert.equal(monthEnd(new Date('2026-12-10T00:00:00Z')).toISOString(), '2027-01-01T00:00:00.000Z');
});

test('ajusta o dia 31 para o último dia de fevereiro', () => {
  assert.equal(recurringDate(new Date('2026-02-01T00:00:00Z'), 31).toISOString(), '2026-02-28T12:00:00.000Z');
});

test('mantém o dia configurado quando existe no mês', () => {
  assert.equal(recurringDate(new Date('2026-06-01T00:00:00Z'), 15).toISOString(), '2026-06-15T12:00:00.000Z');
});
