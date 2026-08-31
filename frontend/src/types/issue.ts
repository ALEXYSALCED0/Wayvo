/**
 * Types for Reporting Issues, Recalculation, and General Alternative Options
 */

export type IssueScenarioType = 
  | 'missed_train'
  | 'stay_longer_rome'
  | 'museum_closed'
  | 'preference_change'
  | 'custom';

export interface IssueScenario {
  id: IssueScenarioType;
  title: string;
  description: string;
  iconName: string;
}

export type AlternativeType =
  | 'transit'
  | 'activity'
  | 'accommodation'
  | 'combined'
  | 'flight'
  | 'train'
  | 'bus'
  | 'museum'
  | 'tour'
  | 'meal';

export interface AlternativeOption {
  id: string;
  type: AlternativeType;
  typeLabel?: string;
  title: string;
  subtitle?: string;
  provider?: string;
  iconName?: string;
  isFastest?: boolean;
  isRecommended?: boolean;
  isEco?: boolean;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: string | number;
  priceDiff?: string;
  description: string;
  additionalActivities?: string[];
  newItemsToInject?: Array<{
    title: string;
    description: string;
    time: string;
    type: 'activity' | 'transit' | 'accommodation' | 'dining';
    typeLabel: string;
  }>;
}

export type TimelinePhase = 
  | 'normal'
  | 'recalculating'
  | 'alternatives_ready'
  | 'updated';
