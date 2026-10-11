# Tarifas de referencia que usa el budget_agent.
# Son valores orientativos para armar el plan: el precio real lo
# confirma provider-service durante el checkout (Saga).

# "Personalizado" no tiene tarifa propia: se usa la de Estándar.
DEFAULT_CATEGORY = "Estándar"

PERSONS_PER_ROOM = 2

# Alojamiento: precio por noche y por habitación.
NIGHTLY_RATE_PER_ROOM = {
    "COP": {
        "Económico": 120_000,
        "Estándar": 250_000,
        "Lujo": 600_000,
    },
    "USD": {
        "Económico": 30,
        "Estándar": 65,
        "Lujo": 150,
    },
    "EUR": {
        "Económico": 28,
        "Estándar": 60,
        "Lujo": 140,
    },
}

# Presupuesto total sugerido por persona y por día. Se usa cuando
# el usuario no indica approximateBudgetAmount (es opcional en el contrato).
DAILY_BUDGET_PER_PERSON = {
    "COP": {
        "Económico": 250_000,
        "Estándar": 450_000,
        "Lujo": 1_200_000,
    },
    "USD": {
        "Económico": 60,
        "Estándar": 110,
        "Lujo": 300,
    },
    "EUR": {
        "Económico": 55,
        "Estándar": 100,
        "Lujo": 280,
    },
}
