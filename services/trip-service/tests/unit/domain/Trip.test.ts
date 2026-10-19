import { describe, expect, it } from 'vitest';
import { Trip } from '../../../src/domain/entities/Trip';
import { EventType, TripStatus } from '../../../src/domain/enums';
import { InvalidDataError, InvalidTripStateError } from '../../../src/domain/errors';
import { at, makeTrip, makeTripWithEvents } from './helpers';

describe('Trip', () => {
  it('empieza en PENDING y tiene un título por defecto', () => {
    const t = makeTrip();
    expect(t.status).toBe(TripStatus.PENDING);
    expect(t.title).toBe('Viaje a Roma');
  });

  it('origin y travelers son opcionales', () => {
    const t = new Trip({
      userId: 'u1', destination: 'Roma', startDate: at(1, '00:00'), endDate: at(2, '00:00'),
    });
    expect(t.origin).toBeUndefined();
    expect(t.travelers).toBeUndefined();
  });

  it('puede pasar de PENDING a CONFIRMED', () => {
    const t = makeTrip();
    t.changeStatus(TripStatus.CONFIRMED);
    expect(t.status).toBe(TripStatus.CONFIRMED);
  });

  it('puede pasar de PENDING a CANCELLED (compensación de la Saga)', () => {
    const t = makeTrip();
    t.changeStatus(TripStatus.CANCELLED);
    expect(t.status).toBe(TripStatus.CANCELLED);
  });

  it('no permite salir de CANCELLED', () => {
    const t = makeTrip();
    t.changeStatus(TripStatus.CANCELLED);
    expect(() => t.changeStatus(TripStatus.CONFIRMED)).toThrow(InvalidTripStateError);
  });

  it('rechaza una fecha de fin anterior a la de inicio', () => {
    expect(() => new Trip({
      userId: 'u1', destination: 'Roma', startDate: at(3, '00:00'), endDate: at(1, '00:00'),
    })).toThrow(InvalidDataError);
  });

  it('rechaza un número de viajeros inválido', () => {
    expect(() => new Trip({
      userId: 'u1', destination: 'Roma', startDate: at(1, '00:00'), endDate: at(2, '00:00'),
      travelers: 0,
    })).toThrow(InvalidDataError);
  });

  it('update cambia datos y valida fechas', () => {
    const t = makeTrip();
    t.update({ title: 'Mi viaje', travelers: 2 });
    expect(t.title).toBe('Mi viaje');
    expect(t.travelers).toBe(2);
    expect(() => t.update({ endDate: at(1, '00:00'), startDate: at(2, '00:00') }))
      .toThrow(InvalidDataError);
  });

  it('update no permite dejar eventos fuera de las nuevas fechas', () => {
    const { trip } = makeTripWithEvents();
    expect(() => trip.update({ startDate: at(2, '00:00') })).toThrow(InvalidTripStateError);
  });

  it('no permite editar un viaje cancelado', () => {
    const t = makeTrip();
    t.changeStatus(TripStatus.CANCELLED);
    expect(() => t.update({ title: 'x' })).toThrow(InvalidTripStateError);
    expect(() => t.addEvent({
      type: EventType.MEAL, title: 'Cena', description: 'x', startDateTime: at(1, '20:00'),
    })).toThrow(InvalidTripStateError);
  });

  it('addEvent rechaza eventos fuera de las fechas del viaje', () => {
    const t = makeTrip();
    expect(() => t.addEvent({
      type: EventType.MEAL, title: 'Cena', description: 'x',
      startDateTime: new Date('2026-12-10T20:00:00Z'),
    })).toThrow(InvalidTripStateError);
  });

  it('numera los eventos por hora de inicio, sin importar el orden en que se agregan', () => {
    const t = makeTrip();
    const tarde = t.addEvent({
      type: EventType.MEAL, title: 'Cena', description: 'x', startDateTime: at(1, '20:00'),
    });
    const manana = t.addEvent({
      type: EventType.TRANSPORT, title: 'Tren', description: 'x', startDateTime: at(1, '08:00'),
    });
    expect(manana.order).toBe(1);
    expect(tarde.order).toBe(2);
  });
});
