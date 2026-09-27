importconst express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "SKYHIGH IMPORTS backend",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    mercadoPagoConfigured: Boolean(MP_ACCESS_TOKEN)
  });
});

app.post("/criar-pagamento", async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "MP_ACCESS_TOKEN não configurado no servidor."
      });
    }

    const { title, price, quantity = 1, external_reference } = req.body;

    const unitPrice = Number(price);
    const qty = Number(quantity);

    if (
      !title ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      return res.status(400).json({
        error: "Envie title, price e quantity válidos."
      });
    }

    const preference = {
      items: [
        {
          title: String(title),
          quantity: qty,
          currency_id: "BRL",
          unit_price: unitPrice
        }
      ],
      external_reference: external_reference
        ? String(external_reference)
        : `skyhigh-${Date.now()}`
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preference)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago:", data);

      return res.status(response.status).json({
        error: "Mercado Pago recusou a criação do pagamento.",
        details: data
      });
    }

    res.json({
      ok: true,
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point || null
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro interno ao criar pagamento."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `SKYHIGH IMPORTS backend rodando na porta ${PORT}`
  );
});
