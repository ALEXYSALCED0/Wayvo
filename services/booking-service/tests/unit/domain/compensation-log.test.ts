import {
  CompensationLog,
  SagaStep,
  StepOutcome,
} from '../../../src/domain/entities/compensation-log';

function openLog(): CompensationLog {
  return CompensationLog.open({
    id: 'log-1',
    correlationId: 'corr-1',
    tripId: 'trip-1',
    bookingId: 'booking-1',
    failedStep: SagaStep.RESERVE_PROVIDER,
    reason: 'Provider unavailable',
  });
}

describe('CompensationLog', () => {
  it('registra el paso que falló y las compensaciones en orden', () => {
    const log = openLog();
    log.record(SagaStep.COMPENSATE_BOOKING, StepOutcome.SUCCEEDED);
    log.record(SagaStep.COMPENSATE_TRIP, StepOutcome.SUCCEEDED);

    expect(log.failedStep).toBe(SagaStep.RESERVE_PROVIDER);
    expect(log.entries.map((e) => e.step)).toEqual([
      SagaStep.COMPENSATE_BOOKING,
      SagaStep.COMPENSATE_TRIP,
    ]);
    expect(log.isFullyCompensated()).toBe(true);
  });

  it('no está compensado si alguna compensación falló', () => {
    const log = openLog();
    log.record(SagaStep.COMPENSATE_BOOKING, StepOutcome.SUCCEEDED);
    log.record(SagaStep.COMPENSATE_TRIP, StepOutcome.FAILED, 'trip-service timeout');
    expect(log.isFullyCompensated()).toBe(false);
  });

  it('no está compensado si aún no hay compensaciones', () => {
    expect(openLog().isFullyCompensated()).toBe(false);
  });
});