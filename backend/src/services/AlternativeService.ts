/**
 * AlternativeService - Dynamic Alternative Generation (Rule-based recommendation pool)
 * Modular boundary corresponding to the future Recommendation / Multi-Agent AI Microservice
 */
import { Event } from '../domain/models/Event';
import { EventType } from '../domain/enums/EventType';
import { IssueType } from '../domain/enums/IssueType';
import { AlternativeOption } from '../domain/models/Alternative';

export class AlternativeService {
  /**
   * Generates alternatives tailored to the event type and reported issue
   */
  generateAlternatives(
    event: Event,
    issueType: IssueType,
    reason?: string
  ): AlternativeOption[] {
    const isMissed = issueType === IssueType.MISSED;
    const isPlanChange = issueType === IssueType.USER_CHANGED_PLAN;

    switch (event.type) {
      case EventType.TRANSPORT:
        return this.getTransportAlternatives(event, issueType);

      case EventType.FLIGHT:
        return this.getFlightAlternatives(event, issueType);

      case EventType.MUSEUM:
      case EventType.TOUR:
        return this.getCulturalAlternatives(event, issueType);

      case EventType.MEAL:
        return this.getMealAlternatives(event, issueType);

      case EventType.ACTIVITY:
      default:
        if (isPlanChange) {
          return this.getPlanChangeAlternatives(event);
        }
        return this.getGenericActivityAlternatives(event, issueType);
    }
  }

  private getTransportAlternatives(event: Event, issueType: IssueType): AlternativeOption[] {
    return [
      {
        id: 'alt-train-next',
        title: 'Eurostar Next Express (Standard Premier)',
        description: 'Next available high-speed departure with guaranteed window seating and dining service.',
        provider: 'Eurostar Continental',
        departureTime: '15:30',
        arrivalTime: '18:45',
        duration: '3h 15m',
        price: 185.0,
        currency: 'USD',
        isFastest: true,
        scoreMatch: 98,
        newEventsToInject: [
          {
            title: 'High-Speed Rail: Next Express to Paris',
            description: 'Direct high-speed connection with open seat in Standard Premier.',
            time: '15:30 - 18:45',
            type: EventType.TRANSPORT,
            typeLabel: 'High-Speed Rail',
            location: event.location || 'Rome Termini Station',
          },
        ],
      },
      {
        id: 'alt-bus-premium',
        title: 'FlixBus Executive Sleeper',
        description: 'Direct premium highway service with panoramic reclining leather seats and power outlets.',
        provider: 'FlixBus Premium',
        departureTime: '16:00',
        arrivalTime: '21:30',
        duration: '5h 30m',
        price: 72.0,
        currency: 'USD',
        isBestValue: true,
        scoreMatch: 86,
        newEventsToInject: [
          {
            title: 'Express Luxury Coach to France',
            description: 'Direct highway coach connection with reclining leather seats.',
            time: '16:00 - 21:30',
            type: EventType.TRANSPORT,
            typeLabel: 'Express Coach',
            location: 'Tiburtina Station, Rome',
          },
        ],
      },
      {
        id: 'alt-morning-scenic',
        title: 'Overnight Alpine Sleeper Train',
        description: 'Relax in a private sleeper cabin traversing the scenic Alpine pass overnight.',
        provider: 'Nightjet Continental',
        departureTime: '20:15',
        arrivalTime: '07:30 (+1d)',
        duration: '11h 15m',
        price: 210.0,
        currency: 'USD',
        scoreMatch: 92,
        newEventsToInject: [
          {
            title: 'Nightjet Sleeper Cabin to Paris',
            description: 'Private single compartment with complimentary breakfast.',
            time: '20:15 - 07:30 (+1d)',
            type: EventType.TRANSPORT,
            typeLabel: 'Overnight Rail',
            location: 'Rome Termini Station',
          },
        ],
      },
    ];
  }

  private getFlightAlternatives(event: Event, issueType: IssueType): AlternativeOption[] {
    return [
      {
        id: 'alt-flight-next',
        title: 'Next Direct Flight: Air France AF-1405',
        description: 'Priority standby with confirmed business seat on next scheduled departure.',
        provider: 'Air France',
        departureTime: '16:45',
        arrivalTime: '19:00',
        duration: '2h 15m',
        price: 260.0,
        currency: 'USD',
        isFastest: true,
        scoreMatch: 97,
        newEventsToInject: [
          {
            title: 'Flight AF-1405: Direct Connection',
            description: 'Expedited security lane and priority boarding.',
            time: '16:45 - 19:00',
            type: EventType.FLIGHT,
            typeLabel: 'Flight',
            location: event.location,
          },
        ],
      },
      {
        id: 'alt-flight-morning',
        title: 'Morning Flight + Airport Lounge Hotel',
        description: 'Early morning flight with complimentary access to the airport transit lounge and day room.',
        provider: 'ITA Airways',
        departureTime: '06:30 (+1d)',
        arrivalTime: '08:45',
        duration: '2h 15m',
        price: 195.0,
        currency: 'USD',
        isBestValue: true,
        scoreMatch: 90,
        newEventsToInject: [
          {
            title: 'Flight AZ-302: Morning Flight',
            description: 'Direct morning connection with lounge access.',
            time: '06:30 - 08:45 (+1d)',
            type: EventType.FLIGHT,
            typeLabel: 'Flight',
            location: event.location,
          },
        ],
      },
    ];
  }

  private getCulturalAlternatives(event: Event, issueType: IssueType): AlternativeOption[] {
    return [
      {
        id: 'alt-gallery-borghese',
        title: 'Borghese Gallery & Villa Gardens Tour',
        description: 'Skip-the-line private entry to Bernini and Caravaggio masterworks in the historic villa.',
        provider: 'Rome Cultural Heritage',
        departureTime: '13:00',
        arrivalTime: '15:30',
        duration: '2h 30m',
        price: 65.0,
        currency: 'USD',
        isFastest: true,
        scoreMatch: 96,
        newEventsToInject: [
          {
            title: 'Borghese Gallery & Gardens Tour',
            description: 'Private curated gallery visit and sculpture gardens.',
            time: '13:00 - 15:30',
            type: EventType.MUSEUM,
            typeLabel: 'Curated Gallery',
            location: 'Villa Borghese, Rome',
          },
        ],
      },
      {
        id: 'alt-walking-historic',
        title: 'Old Rome Renaissance Walking & Gelato Tour',
        description: 'Guided architectural walk covering the Pantheon, Piazza Navona, and artisan gelaterias.',
        provider: 'Roma Insider Tours',
        departureTime: '14:00',
        arrivalTime: '16:30',
        duration: '2h 30m',
        price: 45.0,
        currency: 'USD',
        isBestValue: true,
        scoreMatch: 91,
        newEventsToInject: [
          {
            title: 'Renaissance Walking & Gelato Tour',
            description: 'Guided artisan walk covering historic fountains and masterworks.',
            time: '14:00 - 16:30',
            type: EventType.TOUR,
            typeLabel: 'Walking Tour',
            location: 'Centro Storico, Rome',
          },
        ],
      },
    ];
  }

  private getMealAlternatives(event: Event, issueType: IssueType): AlternativeOption[] {
    return [
      {
        id: 'alt-dine-bistro',
        title: 'Reserve Table at Artisan Bistro Saint-Germain',
        description: 'Contemporary French seasonal bistro with sommelier wine pairing.',
        provider: 'Bistro Saint-Germain',
        departureTime: '20:45',
        arrivalTime: '22:30',
        duration: '1h 45m',
        price: 95.0,
        currency: 'USD',
        scoreMatch: 95,
        newEventsToInject: [
          {
            title: 'Dinner at Bistro Saint-Germain',
            description: 'Seasonal tasting menu with reserved courtyard table.',
            time: '20:45 - 22:30',
            type: EventType.MEAL,
            typeLabel: 'Dining',
            location: 'Saint-Germain-des-Prés, Paris',
          },
        ],
      },
    ];
  }

  private getPlanChangeAlternatives(event: Event): AlternativeOption[] {
    return [
      {
        id: 'alt-extend-stay',
        title: 'Extend Stay by 1 Day & Reschedule Transit',
        description: 'Adds 24h to explore local hidden gems and moves following connections forward.',
        provider: 'Wayvo Smart Coordination',
        departureTime: 'Next Day',
        duration: '+24 hours',
        price: 120.0,
        currency: 'USD',
        scoreMatch: 99,
        newEventsToInject: [
          {
            title: 'Extended Day: Local Sights & Gastronomy',
            description: 'Flexible leisure day with curated recommendations.',
            time: 'Full Day (+1d)',
            type: EventType.ACTIVITY,
            typeLabel: 'Extended Stay',
            location: event.location,
          },
        ],
      },
    ];
  }

  private getGenericActivityAlternatives(event: Event, issueType: IssueType): AlternativeOption[] {
    return [
      {
        id: 'alt-generic-1',
        title: 'Curated Local Experience Replacement',
        description: 'Recommended alternative activity matching your traveler profile and schedule.',
        provider: 'Wayvo Local Network',
        departureTime: '15:00',
        duration: '2 hours',
        price: 55.0,
        currency: 'USD',
        scoreMatch: 93,
        newEventsToInject: [
          {
            title: `Alternative Experience: ${event.title}`,
            description: 'Curated replacement activity.',
            time: '15:00 - 17:00',
            type: EventType.ACTIVITY,
            typeLabel: 'Activity',
            location: event.location,
          },
        ],
      },
    ];
  }
}
