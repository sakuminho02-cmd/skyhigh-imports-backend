import express from "express";
import cors from "cors";
import "dotenv/config";
import crypto from "node:crypto";
import { MercadoPagoConfig, Order } from "mercadopago";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({origin: process.env.FRONTEND_ORIGIN || "*"}));
app.use(express.json({limit:"100kb"}));

const token = process.env.MP_ACCESS_TOKEN;
const client = token ? new MercadoPagoConfig({accessToken: token, options:{timeout:10000}}) : null;
const orders = client ? new Order(client) : null;

function money(v){
  const n=Number(v);
  if(!Number.isFinite(n)||n<=0||n>1000000) throw new Error("Valor inválido.");
  return n.toFixed(2);
}
function email(v){
  if(typeof v!=="string" || !v.includes("@") || v.length>200) throw new Error("E-mail inválido.");
  return v.trim();
}

app.get("/health",(req,res)=>res.json({ok:true,service:"SKYHIGH IMPORTS backend",mercadopagoConfigured:Boolean(token)}));

app.post("/api/orders",async(req,res)=>{
  try{
    if(!orders) return res.status(503).json({error:"Backend ainda não configurado.",detail:"Adicione MP_ACCESS_TOKEN no Render."});
    const {amount,email:payerEmail,paymentMethod="pix",cardToken,paymentMethodId,installments=1}=req.body||{};
    const total=money(amount), payer=email(payerEmail);
    const payment={amount:total,payment_method:{}};

    if(paymentMethod==="pix"){
      payment.payment_method={id:"pix",type:"bank_transfer"};
      payment.expiration_time="PT24H";
    }else if(paymentMethod==="credit_card"||paymentMethod==="debit_card"){
      if(!cardToken) return res.status(400).json({error:"Token do cartão ausente."});
      if(!paymentMethodId) return res.status(400).json({error:"paymentMethodId ausente."});
      const inst=Number(installments);
      if(!Number.isInteger(inst)||inst<1||inst>24) return res.status(400).json({error:"Parcelas inválidas."});
      payment.payment_method={id:paymentMethodId,type:paymentMethod,token:cardToken,installments:inst};
    }else{
      return res.status(400).json({error:"Forma de pagamento não suportada.",allowed:["pix","credit_card","debit_card"]});
    }

    const result=await orders.create({
      body:{
        type:"online",processing_mode:"automatic",
        total_amount:total,
        external_reference:`SKYHIGH-${Date.now()}-${crypto.randomUUID().slice(0,8)}`,
        payer:{email:payer},
        transactions:{payments:[payment]}
      },
      requestOptions:{idempotencyKey:crypto.randomUUID()}
    });

    const p=result?.transactions?.payments?.[0];
    const pm=p?.payment_method;
    res.status(201).json({
      orderId:result.id,status:result.status,statusDetail:result.status_detail,
      paymentId:p?.id||null,
      pix:paymentMethod==="pix"?{qrCode:pm?.qr_code||null,qrCodeBase64:pm?.qr_code_base64||null,ticketUrl:pm?.ticket_url||null}:null
    });
  }catch(e){
    console.error(e);
    res.status(500).json({error:"Não foi possível criar o pagamento.",detail:e?.message||"Erro desconhecido."});
  }
});

app.get("/api/orders/:id",async(req,res)=>{
  try{
    if(!orders) return res.status(503).json({error:"Backend ainda não configurado."});
    const r=await orders.get({id:req.params.id});
    res.json({orderId:r.id,status:r.status,statusDetail:r.status_detail,raw:r});
  }catch(e){res.status(500).json({error:"Não foi possível consultar o pedido.",detail:e?.message||"Erro desconhecido."});}
});

app.listen(PORT,()=>console.log(`SKYHIGH backend na porta ${PORT}`));
