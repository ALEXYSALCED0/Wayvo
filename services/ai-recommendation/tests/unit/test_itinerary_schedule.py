from datetime import datetime

from application.itinerary_builder import _fits_schedule


def test_rechaza_eventos_que_se_solapan():
    day = {
        "events": [
            {
                "startDateTime": "2026-11-15T09:00:00",
                "endDateTime": "2026-11-15T11:00:00",
            }
        ]
    }

    # Este evento comienza antes de que termine el existente.
    start = datetime.fromisoformat("2026-11-15T10:00:00")
    end = datetime.fromisoformat("2026-11-15T12:00:00")

    assert _fits_schedule(day, start, end) is False


def test_permite_eventos_consecutivos_sin_solapamiento():
    day = {
        "events": [
            {
                "startDateTime": "2026-11-15T09:00:00",
                "endDateTime": "2026-11-15T11:00:00",
            }
        ]
    }

    # El nuevo evento empieza justo cuando termina el anterior.
    start = datetime.fromisoformat("2026-11-15T11:00:00")
    end = datetime.fromisoformat("2026-11-15T12:00:00")

    assert _fits_schedule(day, start, end) is True


def test_permite_eventos_en_horarios_separados():
    day = {
        "events": [
            {
                "startDateTime": "2026-11-15T09:00:00",
                "endDateTime": "2026-11-15T10:00:00",
            }
        ]
    }

    start = datetime.fromisoformat("2026-11-15T14:00:00")
    end = datetime.fromisoformat("2026-11-15T15:00:00")

    assert _fits_schedule(day, start, end) is True



from datetime import date, time

from application.itinerary_builder import _schedule_event


def test_schedule_event_busca_otro_horario_si_el_preferido_esta_ocupado():
    day = {
        "date": "2026-11-15",
        "events": [
            {
                "startDateTime": "2026-11-15T09:00:00",
                "endDateTime": "2026-11-15T11:00:00",
            }
        ],
    }

    scheduled = _schedule_event(
        day=day,
        trip_id="trip-test-001",
        title="Actividad de prueba",
        description="Actividad ficticia",
        event_type="ACTIVITY",
        location="Cartagena",
        cost=50000,
        preferred_time=time(9, 0),
        duration_hours=1,
    )

    assert scheduled is True
    assert len(day["events"]) == 2

    new_event = next(
        event for event in day["events"]
        if event.get("title") == "Actividad de prueba"
    )

    assert new_event["startDateTime"] != "2026-11-15T09:00:00"

