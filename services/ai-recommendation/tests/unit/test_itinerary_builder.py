from datetime import date

from application.itinerary_builder import itinerary_builder


def test_constructor_genera_itinerario_para_todas_las_fechas():
    state = {
        "userId": "user-test-001",
        "origin": "Barranquilla",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "transport_result": {
            "outbound": [
                {
                    "origin": "Barranquilla",
                    "destination": "Cartagena",
                    "mode": "bus",
                    "estimatedDuration": "2 horas",
                    "estimatedCost": 100000,
                }
            ],
            "inbound": [
                {
                    "origin": "Cartagena",
                    "destination": "Barranquilla",
                    "mode": "bus",
                    "estimatedDuration": "2 horas",
                    "estimatedCost": 100000,
                }
            ],
        },
        "experiences_result": {
            "activities": [
                {
                    "title": "Visita cultural",
                    "category": "Cultura",
                    "description": "Actividad de prueba",
                    "duration": "2 horas",
                    "estimatedCost": 50000,
                    "bestTimeOfDay": "morning",
                    "bookingRequired": False,
                }
            ],
            "gastronomy": [
                {
                    "dish": "Comida típica",
                    "typicalPlace": "Restaurante de prueba",
                    "description": "Comida de prueba",
                    "mealType": "lunch",
                    "estimatedCost": 30000,
                }
            ],
        },
    }

    result = itinerary_builder(state)

    assert result.get("planId")
    assert result.get("tripDraft")
    assert result.get("itinerary")

    itinerary = result["itinerary"]
    assert itinerary["destination"] == "Cartagena"

    expected_dates = [
        "2026-11-15",
        "2026-11-16",
        "2026-11-17",
        "2026-11-18",
    ]
    actual_dates = [day["date"] for day in itinerary["days"]]

    assert actual_dates == expected_dates

    for day in itinerary["days"]:
        assert isinstance(day["events"], list)


def test_lo_que_no_cabe_en_el_horario_es_aviso_y_no_error():
    # Viaje de un solo día con un transporte de 14 horas (08:00 - 22:00):
    # la actividad no cabe, pero el itinerario se genera igual.
    state = {
        "userId": "user-test-001",
        "origin": "Bogotá",
        "destination": "Santa Marta",
        "startDate": "2026-11-15",
        "endDate": "2026-11-15",
        "travelers": 1,
        "transport_result": {
            "outbound": [
                {
                    "mode": "bus",
                    "estimatedDuration": "14 horas",
                    "estimatedCost": 150000,
                }
            ],
        },
        "experiences_result": {
            "activities": [
                {
                    "title": "Playa",
                    "description": "Tarde de playa",
                    "duration": "2 horas",
                    "estimatedCost": 0,
                    "bestTimeOfDay": "afternoon",
                }
            ],
            "gastronomy": [],
        },
    }

    result = itinerary_builder(state)

    assert result["errors"] == []
    assert result.get("itinerary")
    assert any("Playa" in message for message in result["messages"])


def test_un_regreso_largo_o_nocturno_no_rompe_el_itinerario():
    # Caso real con Gemini: el regreso era un bus largo que no cabía antes de las 22:00.
    state = {
        "userId": "user-test-001",
        "origin": "Bogotá",
        "destination": "Cartagena",
        "startDate": "2026-12-10",
        "endDate": "2026-12-13",
        "travelers": 2,
        "transport_result": {
            "outbound": [
                {
                    "mode": "flight",
                    "departureTime": "19:45",
                    "estimatedDuration": "1 hora y 30 minutos",
                    "estimatedCost": 580000,
                }
            ],
            "inbound": [
                {
                    "mode": "bus",
                    "departureTime": "21:30",
                    "estimatedDuration": "20 horas",
                    "estimatedCost": 300000,
                }
            ],
        },
        "experiences_result": {"activities": [], "gastronomy": []},
    }

    result = itinerary_builder(state)

    assert result["errors"] == []
    last_day = result["itinerary"]["days"][-1]["events"]
    assert last_day[0]["startDateTime"] == "2026-12-13T21:30:00"
    assert last_day[0]["endDateTime"] == "2026-12-14T17:30:00"
