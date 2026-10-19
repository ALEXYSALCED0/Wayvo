from application.provider_catalog_agent import provider_catalog_agent


def make_state(**changes):
    state = {
        "origin": "Bogotá",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "budgetCategory": "Estándar",
        "transport_result": {
            "outbound": [{"mode": "bus", "estimatedCost": 100_000}],
            "inbound": [{"mode": "bus", "estimatedCost": 100_000}],
        },
        "experiences_result": {
            "activities": [{"title": "Playa", "estimatedCost": 0}],
            "gastronomy": [],
        },
    }
    state.update(changes)
    return state


def test_reemplaza_el_transporte_de_ida_por_los_vuelos_del_catalogo():
    result = provider_catalog_agent(make_state())

    outbound = result["transport_result"]["outbound"]
    assert {route["offerId"] for route in outbound} == {
        "offer-aerocaribe-bog-ctg-am",
        "offer-aerocaribe-bog-ctg-pm",
    }
    # Precio por persona x 2 viajeros.
    assert outbound[0]["estimatedCost"] == 320_000 * 2
    # El regreso sugerido por Gemini se conserva (el catálogo no tiene vuelo de vuelta).
    assert result["transport_result"]["inbound"][0]["mode"] == "bus"


def test_alojamiento_estandar_usa_habitaciones_por_noche():
    result = provider_catalog_agent(make_state())

    options = result["accommodation_options"]
    assert [option["offerId"] for option in options] == ["offer-colonial-standard"]
    # 2 viajeros = 1 habitación, 3 noches.
    assert options[0]["quantity"] == 3
    assert options[0]["estimatedCost"] == 420_000 * 3


def test_categoria_lujo_ofrece_solo_alojamiento_de_lujo():
    result = provider_catalog_agent(make_state(budgetCategory="Lujo"))

    offer_ids = {option["offerId"] for option in result["accommodation_options"]}
    assert offer_ids == {"offer-colonial-suite", "offer-casasdelmar-ctg-penthouse"}


def test_agrega_el_tour_del_catalogo_a_las_actividades():
    result = provider_catalog_agent(make_state())

    activities = result["experiences_result"]["activities"]
    assert activities[0]["title"] == "Playa"  # se conservan las de Gemini
    tour = activities[-1]
    assert tour["offerId"] == "offer-guia-ciudad-amurallada"
    assert tour["quantity"] == 2


def test_reconoce_la_ciudad_sin_importar_tildes_ni_mayusculas():
    result = provider_catalog_agent(
        make_state(origin="BOGOTA D.C.", destination="cartagena de indias")
    )

    assert "transport_result" in result
    assert "accommodation_options" in result


def test_ruta_sin_ofertas_no_cambia_nada():
    state = make_state(origin="Pasto", destination="Villa de Leyva")

    result = provider_catalog_agent(state)

    assert "transport_result" not in result
    assert "accommodation_options" not in result
    assert "experiences_result" not in result
    assert "no hay ofertas" in result["messages"][-1]
