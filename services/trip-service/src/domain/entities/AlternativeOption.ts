import { randomUUID } from 'crypto';
import { AlternativeType, EventType } from '../enums';

// Se insertan en el viaje si el usuario elige esta alternativa.
export interface EventDraft {
  type: EventType;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime?: Date;
  location?: string;
}

export interface AlternativeOptionProps {
  id?: string;
  title: string;
  description: string;
  newEvents: EventDraft[];
  type?: AlternativeType;
  provider?: string;
  price?: number;
  currency?: string;
  isRecommended?: boolean;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  isFastest?: boolean;
  isBestValue?: boolean;
  scoreMatch?: number;
}

export class AlternativeOption {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly newEvents: EventDraft[];
  readonly type?: string;
  readonly provider?: string;
  readonly price?: number;
  readonly currency?: string;
  readonly isRecommended: boolean;
  readonly departureTime?: string;
  readonly arrivalTime?: string;
  readonly duration?: string;
  readonly isFastest: boolean;
  readonly isBestValue: boolean;
  readonly scoreMatch?: number;

  constructor(props: AlternativeOptionProps) {
    this.id = props.id ?? randomUUID();
    this.title = props.title;
    this.description = props.description;
    this.newEvents = props.newEvents;
    this.type = props.type;
    this.provider = props.provider;
    this.price = props.price;
    this.currency = props.currency;
    this.isRecommended = props.isRecommended ?? false;
    this.departureTime = props.departureTime;
    this.arrivalTime = props.arrivalTime;
    this.duration = props.duration;
    this.isFastest = props.isFastest ?? false;
    this.isBestValue = props.isBestValue ?? false;
    this.scoreMatch = props.scoreMatch;
  }
}
