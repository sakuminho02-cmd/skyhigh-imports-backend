# SKYHIGH IMPORTS — Backend Mercado Pago

Backend inicial para a integração com a Orders API do Mercado Pago.

## Deploy no Render
1. Envie estes arquivos para um repositório GitHub.
2. Render → New Web Service → conecte o repositório.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Node 18 ou superior.
6. Em Environment Variables, crie `MP_ACCESS_TOKEN` com o Access Token de TESTE.
7. Opcionalmente defina `FRONTEND_ORIGIN` para a URL do seu site.

Teste depois em `https://SEU-SERVICO.onrender.com/health`.

NUNCA coloque o Access Token no HTML ou em código público.

## Próxima etapa
Conectar o HTML ao endpoint `/api/orders` e usar MercadoPago.js no frontend para gerar o token do cartão.
