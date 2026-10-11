from application.budget_agent import budget_agent


def make_state(
    budget=1_000_000,
    accommodation=True,
):
    state = {
        "userId": "user-test",
        "origin": "Barranquilla",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "budgetCategory": "Estándar",
        "currency": "COP",
        "approximateBudgetAmount": budget,
        "transport_result": {
            "outbound": [
                {
                    "mode": "bus",
                    "estimatedDuration": "2 horas",
                    "estimatedCost": 100_000,
                },
                {
                    "mode": "flight",
                    "estimatedDuration": "1 hora",
                    "estimatedCost": 250_000,
                },
            ],
            "inbound": [
                {
                    "mode": "bus",
                    "estimatedDuration": "2 horas",
                    "estimatedCost": 100_000,
                },
            ],
            "totalTransportCost": 200_000,
        },
        "experiences_result": {
            "activities": [
                {
                    "title": "Museo",
                    "description": "Visita cultural",
                    "duration": "2 horas",
                    "estimatedCost": 30_000,
                    "bestTimeOfDay": "morning",
                },
                {
                    "title": "Tour",
                    "description": "Recorrido guiado",
                    "duration": "3 horas",
                    "estimatedCost": 80_000,
                    "bestTimeOfDay": "afternoon",
                },
            ],
            "gastronomy": [
                {
                    "dish": "Arroz con coco",
                    "typicalPlace": "Restaurante local",
                    "description": "Plato típico",
                    "mealType": "lunch",
                    "estimatedCost": 25_000,
                },
                {
                    "dish": "Pescado",
                    "typicalPlace": "Restaurante local",
                    "description": "Plato típico",
                    "mealType": "dinner",
                    "estimatedCost": 40_000,
                },
            ],
        },
        "errors": [],
    }

    if accommodation:
        state["accommodation_options"] = [
            {"name": "Hotel de prueba", "estimatedCost": 300_000},
            {"name": "Hotel económico", "estimatedCost": 250_000},
        ]
    else:
        state["accommodation_options"] = []

    return state


def test_selecciona_el_transporte_mas_economico():
    result = budget_agent(make_state())

    assert "budget_result" in result
    assert result["transport_result"]["outbound"][0]["estimatedCost"] == 100_000
    assert result["transport_result"]["inbound"][0]["estimatedCost"] == 100_000


def test_selecciona_el_alojamiento_mas_economico():
    result = budget_agent(make_state())

    assert "budget_result" in result
    assert result["selected_accommodation"]["estimatedCost"] == 250_000


def test_el_total_coincide_con_el_desglose_y_no_incluye_emergencias():
    result = budget_agent(make_state())

    assert "budget_result" in result

    budget = result["budget_result"]
    breakdown = budget["breakdown"]

    assert "emergencyFund" not in breakdown
    assert budget["estimatedTotalCost"] == sum(
        breakdown[key]
        for key in ("transport", "accommodation", "activities", "food")
    )


def test_el_total_no_supera_el_presupuesto():
    result = budget_agent(make_state(budget=1_000_000))

    assert "budget_result" in result
    assert result["budget_result"]["estimatedTotalCost"] <= 1_000_000


def test_no_gasta_mas_de_lo_disponible_en_actividades_y_comida():
    result = budget_agent(make_state(budget=500_000))

    if "budget_result" in result:
        budget = result["budget_result"]
        breakdown = budget["breakdown"]

        assert (
            breakdown["transport"]
            + breakdown["accommodation"]
            + breakdown["activities"]
            + breakdown["food"]
            <= 500_000
        )


def test_sin_ofertas_estima_el_alojamiento_por_categoria():
    # Estándar en COP: 250.000 por noche, 2 viajeros = 1 habitación, 3 noches.
    result = budget_agent(make_state(budget=2_000_000, accommodation=False))

    assert "budget_result" in result
    assert result["selected_accommodation"]["isEstimate"] is True
    assert result["budget_result"]["breakdown"]["accommodation"] == 750_000


def test_la_estimacion_usa_mas_habitaciones_si_hay_mas_viajeros():
    state = make_state(budget=5_000_000, accommodation=False)
    state["travelers"] = 3
    state["budgetCategory"] = "Lujo"

    result = budget_agent(state)

    # Lujo: 600.000 por noche, 3 viajeros = 2 habitaciones, 3 noches.
    assert result["selected_accommodation"]["rooms"] == 2
    assert result["budget_result"]["breakdown"]["accommodation"] == 3_600_000


def test_moneda_sin_tarifas_devuelve_error_explicito():
    state = make_state(accommodation=False)
    state["currency"] = "MXN"

    result = budget_agent(state)

    assert "budget_result" not in result
    assert any("alojamiento" in error.lower() for error in result["errors"])


def test_sin_monto_sugiere_un_presupuesto_por_categoria():
    # Estándar en COP: 450.000 por persona y día, 2 viajeros, 4 días.
    result = budget_agent(make_state(budget=None))

    assert "budget_result" in result
    assert result["budget_amount"] == 3_600_000
    assert result["budget_result"]["estimatedTotalCost"] <= 3_600_000


def test_sin_presupuesto_devuelve_error():
    state = make_state(budget=None)
    state["budget_amount"] = 0

    result = budget_agent(state)

    assert "budget_result" not in result
    assert result["errors"]


def test_no_modifica_los_costos_originales():
    state = make_state()
    original_cost = state["experiences_result"]["activities"][0]["estimatedCost"]

    budget_agent(state)

    assert state["experiences_result"]["activities"][0]["estimatedCost"] == original_cost
