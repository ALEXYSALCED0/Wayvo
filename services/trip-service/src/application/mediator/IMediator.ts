import { TripMediatorIncidentInput,
  TripMediatorIncidentResult,
  TripMediatorSelectAlternativeInput,
  TripMediatorSelectAlternativeResult
} from '@wayvo/contracts';

export interface IMediator {
  reportIncident(
    input: TripMediatorIncidentInput,
  ): Promise<TripMediatorIncidentResult>;

  selectAlternative(
    input: TripMediatorSelectAlternativeInput,
  ): Promise<TripMediatorSelectAlternativeResult>;
}