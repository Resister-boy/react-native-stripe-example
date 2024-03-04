import bodyParser from 'body-parser';
import express from 'express';
import Stripe from 'stripe';

const stripePublishableKey = "<YOUR PUBLISHABLE KEY>";
const stripeSecretKey = "<YOUR SECRET KEY>";

const app = express();

app.use((req, res, next) => {
  bodyParser.json()(req, res, next);
});

app.get('/stripe-key', (_, res) => {
  return res.send({publishableKey: stripePublishableKey});
});

app.post('/create-payment-intent', async (req, res) => {
  const { id, amount } = req.body;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  // 원래 email로 customer 생성하던 것에서 customerId로 customer 조회, 
  // 서버에서는 따로 customerId 조회하는 API 필요
  const customer = await stripe.customers.retrieve(id);

  const params = {
    amount: amount,
    currency: 'usd',
    customer: customer.id,
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic',
      },
    },
    payment_method_types: ['card'],
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    // 클라이언트에서는 PaymentIntentId만 사용함.
    return res.send({
      paymentIntent
    });
  } catch (error) {
    return res.send({
      error: error.raw.message,
    });
  }
});

// 처음에 결제하면 자동으로 customer 객체가 생성됨.
// 따로 customer 생성할 수도 있음.
app.post('/create-customer', async(req, res) => {
  const { email } = req.body;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false
  })

  const customer = await stripe.customers.create({ email });

  console.log(customer)

  return res.json({
    customer: customer
  })
})

// customerId로 customer 조회 가능.
app.post('/fetch-customer', async(req, res) => {
  const { id } = req.body;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false
  });

  const customer = await stripe.customers.retrieve(id);

  console.log(customer)

  return res.json({
    customer: customer
  })
})

// customerId로 해당 customer가 가진 paymentMethod 조회.
// 많을 수도 있어서 아래 코드에서는 첫 번째만 사용.
app.post('/retrieve-payment-method', async(req, res) => {
  const { id } = req.body;

  console.log(id)

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });

  const paymentMethodList = await stripe.customers.listPaymentMethods(id, {
    limit: 1,
  })

  console.log(paymentMethodList)
  console.log("paymentMethod", paymentMethodList.data.length !== 0 && paymentMethodList.data[0].card);

  return res.json({
    paymentMethodList 
  })
})

// 현재 플로우에서도 paymentMethod 객체가 생성되는지는 모르겠음.
// 피그마에서 따로 카드등록 화면도 있어서 어차피 필요할 듯.

// 아래 코드가 스트라이프에서 메일 받은 코드. 사용 X
// paymentMethod는 클라이언트에서 등록할 수 있음.
// app.post('/create-payment-method', async(req, res) => {
//   const { type, customer } = req.body;

//   const stripe = new Stripe(stripeSecretKey, {
//     apiVersion: '2023-10-16',
//     typescript: false,
//   });

//   console.log(type, customer)


//   const paymentMethod = await stripe.paymentMethods.create({
//     type: 'card',
//     card: {
//       number: '4242424242424242',
//       exp_month: 4,
//       exp_year: 2024,
//       cvc: '242',
//     },
//   });

//   console.log("paymentMethod", paymentMethod);
//   return res.json({
//     paymentMethod
//   })
// })

// customerId와 paymentMethod를 받아서 연동
app.post('/attach-payment-method', async(req, res) => {
  const { customer, paymentMethod: pid } = req.body;

  console.log(customer, pid)

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });

  const paymentMethod = await stripe.paymentMethods.attach(
    pid,
    {
      customer: customer,
    }
  );

  console.log(paymentMethod.card);

  return res.json({
    paymentMethod
  })
})

app.post('/detach-payment-method', async(req, res) => {
  const { paymentMethodId } = req.body;

  console.log(paymentMethodId)
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });

  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

  console.log(paymentMethod.card);
  return res.json({
    true: true
  })
})

// 결제 컨펌 API
// PaymentIntentId랑 PaymentMethodId를 받아서 컨펌됨. 
// 정상 동작하면 아래 콘솔에서 status: succeed 확인 가능.
app.post('/confirm-payment-intent', async(req, res) => {
  const { paymentIntentId: piid, paymentMethod: pmid } = req.body;

  console.log(piid, pmid)

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });

  const paymentIntent = await stripe.paymentIntents.confirm(
    piid,
    {
      payment_method: pmid,
    }
  );

  console.log("paymentIntent Confirmed", paymentIntent);

  return res.json({
    paymentIntent
  })
})

app.listen(8080, () => console.log(`Node server listening on port ${8080}!`));
