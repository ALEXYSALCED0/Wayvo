import json
import os
import re

from domain.state import TravelState


VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
VALID_TIMES = {"morning", "afternoon", "evening"}

# Catálogo curado de entidades verificadas de alta reputación para destinos populares.
VERIFIED_DESTINATION_CATALOG = {
    "cartagena": {
        "restaurants": [
            {
                "venueName": "Restaurante Celele",
                "dish": "Ceviche contemporáneo y flor de Jamaica",
                "typicalPlace": "Alta cocina del Caribe colombiano contemporánea en Getsemaní",
                "description": "Premiado como uno de los 50 mejores de Latinoamérica por su rescate de la biodiversidad caribeña.",
                "mealType": "dinner",
                "estimatedCost": 120000,
                "websiteUrl": "https://celelerestaurante.com",
                "instagramHandle": "celele_restaurante",
            },
            {
                "venueName": "La Cocina de Pepina",
                "dish": "Posta Negra Cartagenera tradicional",
                "typicalPlace": "Restaurante tradicional de cocina criolla cartagenera",
                "description": "Ícono de la cocina casera del Sinú y Cartagena en Getsemaní, famosa por sus sabores auténticos.",
                "mealType": "lunch",
                "estimatedCost": 75000,
                "websiteUrl": None,
                "instagramHandle": "lacocinadepepina",
            },
            {
                "venueName": "La Cevichería",
                "dish": "Ceviche de mariscos en salsa de coco y ají dulce",
                "typicalPlace": "Cevichería tradicional en la Plaza San Diego",
                "description": "Famosa cevicheria caribeña elogiada por Anthony Bourdain en pleno centro histórico.",
                "mealType": "lunch",
                "estimatedCost": 80000,
                "websiteUrl": None,
                "instagramHandle": "lacevicheriacartagena",
            },
            {
                "venueName": "Restaurante Candé",
                "dish": "Pargo rojo al estilo cartagenero con arroz con coco y patacón",
                "typicalPlace": "Cocina 100% autóctona cartagenera en San Diego",
                "description": "Experiencia gastronómica y cultural completa con música en vivo y arquitectura colonial.",
                "mealType": "dinner",
                "estimatedCost": 110000,
                "websiteUrl": "https://canderestaurante.com",
                "instagramHandle": "canderestaurante",
            },
            {
                "venueName": "Pastelería Mila Vargas",
                "dish": "Torta de coco caribeña y café de origen",
                "typicalPlace": "Cafetería y repostería gourmet de autor",
                "description": "Parada obligada en el Centro Amurallado para desayunos, postres refinados y cafés especiales.",
                "mealType": "breakfast",
                "estimatedCost": 45000,
                "websiteUrl": None,
                "instagramHandle": "milapostres",
            },
        ],
        "activities": [
            {
                "title": "Visita Histórica al Castillo San Felipe de Barajas",
                "operatorName": "Fortificaciones de Cartagena",
                "category": "Cultural & Histórico",
                "description": "Exploración de la mayor fortaleza militar construida por los españoles en América, con su complejo de túneles subterráneos.",
                "duration": "2.5 horas",
                "estimatedCost": 70000,
                "bestTimeOfDay": "morning",
                "bookingRequired": True,
                "websiteUrl": "https://fortificacionescartagena.com.co",
                "instagramHandle": "castillodesanfelipe",
            },
            {
                "title": "Pasadía y Navegación a Islas del Rosario en Catamarán",
                "operatorName": "Bonavida Catamarán",
                "category": "Naturaleza & Playa",
                "description": "Navegación a vela por el Parque Nacional Natural Corales del Rosario con almuerzo y careteo.",
                "duration": "6 horas",
                "estimatedCost": 290000,
                "bestTimeOfDay": "morning",
                "bookingRequired": True,
                "websiteUrl": "https://bonavida.co",
                "instagramHandle": "bonavidacatamarans",
            },
            {
                "title": "Recorrido Histórico Guiado por el Centro Amurallado y Getsemaní",
                "operatorName": "Asociación de Guías Profesionales de Cartagena",
                "category": "Cultura Local",
                "description": "Caminata cultural por plazas coloniales, historias de corsarios y el arte urbano de Getsemaní.",
                "duration": "2.5 horas",
                "estimatedCost": 60000,
                "bestTimeOfDay": "afternoon",
                "bookingRequired": False,
                "websiteUrl": None,
                "instagramHandle": None,
            },
            {
                "title": "Atardecer en las Murallas y Baluarte Santo Domingo",
                "operatorName": "Murallas de Cartagena",
                "category": "Paisaje & Relax",
                "description": "Espectacular puesta de sol caribeña sobre el mar y las fortificaciones coloniales.",
                "duration": "2 horas",
                "estimatedCost": 50000,
                "bestTimeOfDay": "evening",
                "bookingRequired": False,
                "websiteUrl": None,
                "instagramHandle": None,
            },
        ],
    },
    "medellin": {
        "restaurants": [
            {
                "venueName": "Restaurante Elcielo",
                "dish": "Menú degustación sensorial colombiano",
                "typicalPlace": "Alta cocina de vanguardia en El Poblado",
                "description": "Experiencia sensorial del chef Juan Manuel Barrientos galardonada internacionalmente.",
                "mealType": "dinner",
                "estimatedCost": 220000,
                "websiteUrl": "https://elcielorestaurant.com",
                "instagramHandle": "elcielorestaurant",
            },
            {
                "venueName": "Mondongo's",
                "dish": "Bandeja paisa y sopa tradicional de Mondongo",
                "typicalPlace": "Restaurante tradicional antioqueño en El Poblado",
                "description": "El clásico infaltable de la comida típica antioqueña con porciones generosas.",
                "mealType": "lunch",
                "estimatedCost": 65000,
                "websiteUrl": "https://mondongos.com.co",
                "instagramHandle": "mondongos",
            },
            {
                "venueName": "Restaurante Carmen Medellín",
                "dish": "Panceta glaseada con maracuyá y arracacha",
                "typicalPlace": "Cocina de autor contemporánea en El Poblado",
                "description": "Menú inspirado en los pisos térmicos de Colombia y productos de pequeños productores.",
                "mealType": "dinner",
                "estimatedCost": 130000,
                "websiteUrl": "https://carmenmedellin.com",
                "instagramHandle": "carmenrestaurante",
            },
        ],
        "activities": [
            {
                "title": "Graffitour Comuna 13 y Escaleras Eléctricas",
                "operatorName": "Casa Kolacho / Guías Locales Comuna 13",
                "category": "Transformación & Arte Urbano",
                "description": "Relato de resiliencia y cultura hip-hop guiado por jóvenes locales de la comunidad.",
                "duration": "3 horas",
                "estimatedCost": 50000,
                "bestTimeOfDay": "afternoon",
                "bookingRequired": False,
                "websiteUrl": None,
                "instagramHandle": None,
            },
            {
                "title": "Paseo en Metrocable y Parque Arví",
                "operatorName": "Metro de Medellín",
                "category": "Ecoturismo",
                "description": "Viaje aéreo panorámico sobre las montañas y caminata en la reserva ecológica.",
                "duration": "4 horas",
                "estimatedCost": 40000,
                "bestTimeOfDay": "morning",
                "bookingRequired": False,
                "websiteUrl": "https://metrodemedellin.gov.co",
                "instagramHandle": None,
            },
        ],
    },
    "bogota": {
        "restaurants": [
            {
                "venueName": "Restaurante Andrés D.C.",
                "dish": "Lomo al trapo con arepa de choclo",
                "typicalPlace": "Restaurante temático y folclor colombiano en Zona T",
                "description": "Ambiente emblemático, gastronomía colombiana diversa y fiesta temática.",
                "mealType": "dinner",
                "estimatedCost": 120000,
                "websiteUrl": "https://andrescarnederes.com",
                "instagramHandle": "andres_carne_de_res",
            },
            {
                "venueName": "La Puerta Falsa",
                "dish": "Ajiaco santafereño tradicional con chocolate y tamal",
                "typicalPlace": "El restaurante más antiguo de Colombia (1816) en La Candelaria",
                "description": "Institución de la cocina bogotana santafereña junto a la Plaza de Bolívar.",
                "mealType": "lunch",
                "estimatedCost": 45000,
                "websiteUrl": None,
                "instagramHandle": "lapuertafalsabogota",
            },
        ],
        "activities": [
            {
                "title": "Ascenso al Cerro de Monserrate en Funicular",
                "operatorName": "Cerro de Monserrate",
                "category": "Mirador & Religioso",
                "description": "Panorámica de 360 grados de la sabana de Bogotá a 3.152 metros de altura.",
                "duration": "3 horas",
                "estimatedCost": 35000,
                "bestTimeOfDay": "morning",
                "bookingRequired": False,
                "websiteUrl": "https://cerromonserrate.com",
                "instagramHandle": None,
            },
            {
                "title": "Recorrido por el Museo del Oro",
                "operatorName": "Banco de la República",
                "category": "Cultural & Arqueológico",
                "description": "La colección de orfebrería y arqueología prehispánica más importante del mundo.",
                "duration": "2.5 horas",
                "estimatedCost": 20000,
                "bestTimeOfDay": "morning",
                "bookingRequired": False,
                "websiteUrl": "https://banrepcultural.org/museo-del-oro",
                "instagramHandle": None,
            },
        ],
    },
    "miami": {
        "restaurants": [
            {
                "venueName": "Versailles Restaurant",
                "dish": "Ropa Vieja cubana con plátanos maduros y arroz moro",
                "typicalPlace": "El restaurante cubano más famoso del mundo en Little Havana",
                "description": "Punto de encuentro histórico y gastronómico de la comunidad cubana en Miami.",
                "mealType": "lunch",
                "estimatedCost": 90000,
                "websiteUrl": "https://versaillesrestaurant.com",
                "instagramHandle": "versaillesmiami",
            },
            {
                "venueName": "Joe's Stone Crab",
                "dish": "Cangrejo moro (Stone Crab) con salsa de mostaza",
                "typicalPlace": "Restaurante centenario legendario en South Beach",
                "description": "Referente culinario indiscutible de mariscos en Miami Beach desde 1913.",
                "mealType": "dinner",
                "estimatedCost": 180000,
                "websiteUrl": "https://joesstonecrab.com",
                "instagramHandle": "joesstonecrab",
            },
        ],
        "activities": [
            {
                "title": "Recorrido por Wynwood Walls y Art District",
                "operatorName": "The Wynwood Walls",
                "category": "Arte Moderno & Murales",
                "description": "Galería abierta con más de 50 murales de artistas urbanos de renombre mundial.",
                "duration": "2.5 horas",
                "estimatedCost": 60000,
                "bestTimeOfDay": "afternoon",
                "bookingRequired": True,
                "websiteUrl": "https://thewynwoodwalls.com",
                "instagramHandle": "wynwoodwallsofficial",
            },
            {
                "title": "Paseo en Barco por Biscayne Bay y Mansiones",
                "operatorName": "Island Queen Cruises",
                "category": "Navegación Panorámica",
                "description": "Crucero turístico bordeando Star Island, Fisher Island y el skyline de Downtown Miami.",
                "duration": "2 horas",
                "estimatedCost": 120000,
                "bestTimeOfDay": "morning",
                "bookingRequired": True,
                "websiteUrl": "https://islandqueencruises.com",
                "instagramHandle": None,
            },
        ],
    },
}


def activities_food_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": ["Falta configurar GOOGLE_API_KEY para activities_food_agent."]
        }

    assessment = state.get("psychologicalAssessment", {})
    destination = state.get("destination", "")
    travelers = state.get("travelers", 1)
    currency = state.get("currency", "COP")

    # Identificar si el destino cuenta con catálogo verificado
    dest_norm = (
        destination.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
    )

    catalog_context = ""
    for city_key, city_data in VERIFIED_DESTINATION_CATALOG.items():
        if city_key in dest_norm:
            catalog_context = f"""
ESTABLECIMIENTOS Y OPERADORES VERIFICADOS EN {destination.upper()} (Usa preferentemente estos para garantizar que no existan datos ficticios):
Restaurantes verificados:
{json.dumps(city_data["restaurants"], ensure_ascii=False, indent=2)}

Actividades y operadores verificados:
{json.dumps(city_data["activities"], ensure_ascii=False, indent=2)}
"""
            break

    prompt = f"""
Eres un concierge local experto en {destination}. Genera recomendaciones gastronómicas y actividades auténticas, prestigiosas y específicas.

Datos del viaje:
- Destino: {destination}
- Origen: {state.get("origin", "No especificado")}
- Fechas: {state.get("startDate") or state.get("start_date", "No especificada")} hasta {state.get("endDate") or state.get("end_date", "No especificada")}
- Viajeros: {travelers}
- Estilo: {state.get("preferredStyle") or "No especificado"}
- Intereses: {assessment.get("interests", [])}
- Restricciones alimentarias: {state.get("dietaryRestrictions", [])}
- Moneda: {currency}

{catalog_context}

REGLAS CRÍTICAS DE CALIDAD:
1. En gastronomía, DEBES nombrar un RESTAURANTE O ESTABLECIMIENTO REAL con su nombre propio (ej: "Restaurante Celele", "La Cocina de Pepina", "La Cevicheria", "Pastelería Mila"). NUNCA uses nombres ficticios o solo el nombre de un plato sin establecimiento.
2. Cada comida debe tener su 'venueName' (el restaurante) y su 'dish' (el plato insignia o especialidad).
3. Si el restaurante tiene sitio web oficial o cuenta de Instagram real y confirmada, inclúyela; si no estás 100% seguro, usa null (el sistema generará el enlace verificado en Google Maps). NO inventes dominios.
4. En actividades, nombra la atracción y el OPERADOR O MUSEO REAL (ej: "Castillo San Felipe de Barajas" operado por "Fortificaciones de Cartagena").

Devuelve EXCLUSIVAMENTE JSON válido con esta estructura:
{{
  "gastronomy": [
    {{
      "venueName": "Nombre real del restaurante",
      "dish": "Nombre del plato especial a probar",
      "typicalPlace": "Breve tipo de lugar",
      "description": "Descripción de la experiencia culinaria",
      "mealType": "lunch",
      "estimatedCost": 75000,
      "websiteUrl": null,
      "instagramHandle": "handle_sin_arroba",
      "directBookingUrl": null,
      "dietaryMatch": true
    }}
  ],
  "activities": [
    {{
      "title": "Nombre de la atracción o tour concreto",
      "operatorName": "Nombre del operador o museo oficial",
      "category": "Cultural",
      "description": "Descripción de la experiencia",
      "duration": "2.5 horas",
      "estimatedCost": 70000,
      "bestTimeOfDay": "morning",
      "bookingRequired": true,
      "websiteUrl": null,
      "instagramHandle": null,
      "directBookingUrl": null
    }}
  ],
  "culturalHighlights": ["Dato cultural relevante de {destination}"]
}}

Reglas de formato:
- Genera entre 3 y 5 recomendaciones gastronómicas y entre 3 y 5 actividades.
- mealType debe ser uno de: breakfast, lunch, dinner, snack.
- bestTimeOfDay debe ser uno de: morning, afternoon, evening.
- estimatedCost debe ser numérico y representar el costo total aproximado para todos los viajeros.
- No incluyas markdown ni texto fuera del JSON.
"""

    try:
        from application.llm_client import invoke_gemini

        text = invoke_gemini(prompt, temperature=0.1)
        clean_text = text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1]
            if clean_text.endswith("```"):
                clean_text = clean_text.rsplit("```", 1)[0]

        result = json.loads(clean_text)

        gastronomy = result.get("gastronomy", [])
        activities = result.get("activities", [])

        if not gastronomy:
            raise ValueError("No se generaron recomendaciones gastronómicas.")

        if not activities:
            raise ValueError("No se generaron actividades.")

        for item in gastronomy:
            if item.get("mealType") not in VALID_MEAL_TYPES:
                item["mealType"] = "lunch"

            self_check_cost = item.get("estimatedCost")
            if (
                not isinstance(self_check_cost, (int, float))
                or isinstance(self_check_cost, bool)
                or self_check_cost < 0
            ):
                item["estimatedCost"] = 60000 * max(1, travelers)

            if not item.get("venueName"):
                item["venueName"] = item.get("typicalPlace") or "Restaurante Local"

            if not item.get("typicalPlace"):
                item["typicalPlace"] = item.get("venueName")

            if not item.get("dish"):
                item["dish"] = "Especialidad gastronómica tradicional"

            if not item.get("description"):
                item["description"] = f"Experiencia culinaria en {item.get('venueName')}."

        for item in activities:
            if item.get("bestTimeOfDay") not in VALID_TIMES:
                item["bestTimeOfDay"] = "morning"

            cost = item.get("estimatedCost")
            if (
                not isinstance(cost, (int, float))
                or isinstance(cost, bool)
                or cost < 0
            ):
                item["estimatedCost"] = 70000 * max(1, travelers)

            for field in ("title", "category", "description", "duration"):
                if not item.get(field):
                    item[field] = "Experiencia local destacada"

            if not isinstance(item.get("bookingRequired"), bool):
                item["bookingRequired"] = False

        experiences_result = {
            "gastronomy": gastronomy,
            "activities": activities,
            "culturalHighlights": result.get("culturalHighlights", []),
        }

        return {
            "experiences_result": experiences_result,
            "food_recommendations": gastronomy,
            "activities": activities,
            "messages": ["Agente de actividades y gastronomía ejecutado con catálogo verificado."],
        }

    except Exception as exc:
        return {
            "errors": [f"Error en activities_food_agent: {exc}"]
        }
