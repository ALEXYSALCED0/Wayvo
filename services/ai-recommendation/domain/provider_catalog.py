# Ofertas reservables del catálogo de provider-service.
# Es una copia del seed de provider-service
# si allá cambian los ids o los precios, hay que actualizarlos aquí.
# La disponibilidad real no se guarda aquí: la verifica la Saga en el checkout.

# Nombre de la ciudad y código.
CITY_CODES = {
    "bogota": "BOG",
    "cartagena": "CTG",
    "medellin": "MDE",
    "santa marta": "SMR",
}

# Precio por persona.
FLIGHT_OFFERS = [
    {
        "providerId": "prov-aerocaribe",
        "offerId": "offer-aerocaribe-bog-ctg-am",
        "title": "Vuelo AeroCaribe Bogotá - Cartagena (mañana)",
        "origin": "BOG",
        "destination": "CTG",
        "departureTime": "06:30",
        "estimatedDuration": "1 hora y 30 minutos",
        "unitPrice": 320_000,
    },
    {
        "providerId": "prov-aerocaribe",
        "offerId": "offer-aerocaribe-bog-ctg-pm",
        "title": "Vuelo AeroCaribe Bogotá - Cartagena (noche)",
        "origin": "BOG",
        "destination": "CTG",
        "departureTime": "19:45",
        "estimatedDuration": "1 hora y 30 minutos",
        "unitPrice": 290_000,
    },
    {
        "providerId": "prov-andes-air",
        "offerId": "offer-andes-bog-mde-am",
        "title": "Vuelo Andes Air Bogotá - Medellín (mañana)",
        "origin": "BOG",
        "destination": "MDE",
        "departureTime": "06:30",
        "estimatedDuration": "1 hora y 5 minutos",
        "unitPrice": 210_000,
    },
    {
        "providerId": "prov-andes-air",
        "offerId": "offer-andes-bog-mde-pm",
        "title": "Vuelo Andes Air Bogotá - Medellín (tarde)",
        "origin": "BOG",
        "destination": "MDE",
        "departureTime": "13:00",
        "estimatedDuration": "1 hora y 5 minutos",
        "unitPrice": 235_000,
    },
]

# Precio por noche y por unidad; "guests" es cuántas personas caben por unidad.
STAY_OFFERS = [
    {
        "providerId": "prov-hotel-colonial",
        "offerId": "offer-colonial-standard",
        "title": "Hotel Colonial: habitación estándar",
        "city": "CTG",
        "guests": 2,
        "isLuxury": False,
        "unitPrice": 420_000,
    },
    {
        "providerId": "prov-hotel-colonial",
        "offerId": "offer-colonial-suite",
        "title": "Hotel Colonial: suite con vista al mar",
        "city": "CTG",
        "guests": 2,
        "isLuxury": True,
        "unitPrice": 780_000,
    },
    {
        "providerId": "prov-casas-del-mar",
        "offerId": "offer-casasdelmar-ctg-penthouse",
        "title": "Casas del Mar: penthouse en Bocagrande",
        "city": "CTG",
        "guests": 4,
        "isLuxury": True,
        "unitPrice": 950_000,
    },
    {
        "providerId": "prov-casas-del-mar",
        "offerId": "offer-casasdelmar-smr-apto",
        "title": "Casas del Mar: apartamento en El Rodadero",
        "city": "SMR",
        "guests": 4,
        "isLuxury": False,
        "unitPrice": 360_000,
    },
]

# Precio por persona. El tour cafetero no tiene ciudad de nuestra lista, por eso no se incluye.
ACTIVITY_OFFERS = [
    {
        "providerId": "prov-guias-cartagena",
        "offerId": "offer-guia-ciudad-amurallada",
        "title": "Guía por la Ciudad Amurallada",
        "description": "Recorrido a pie de 3 horas con guía local.",
        "city": "CTG",
        "duration": "3 horas",
        "bestTimeOfDay": "morning",
        "unitPrice": 85_000,
    },
]
