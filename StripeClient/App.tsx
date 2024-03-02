import { Button, StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { CardField, StripeProvider, createPaymentMethod } from '@stripe/stripe-react-native';
import axios from 'axios';

const stripePublishableKey = "";

const App = () => {
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')


  // PaymentIntent 생성 API 및 컨펌 API 호출
  const handlePayment = async () => {
    // PaymentIntnet 생성 @params customerId 
    const res = await axios.post('http://localhost:8080/create-payment-intent', {
      id: customerId, // customerId는 기본적으로 클라이언트에서 가지고 있어야 함
      amount: 1000
    });

    console.log("createRes", res.data)
    setPaymentIntentId(res.data.paymentIntent.id)

    // PaymentIntent 컨펌 @params paymentIntentId, paymentMethodId
    const confirmRes = await axios.post('http://localhost:8080/confirm-payment-intent', {
      paymentIntentId: res.data.paymentIntent.id,
      paymentMethod: paymentMethodId 
      
      // 서버 아래 코드에서 paymentMethod 가져올 예정
      // app.post('/retrieve-payment-method', async(req, res) => {})

    })
    console.log('confirmRes', confirmRes.data)
  }

    // customer 생성 API 호출
  const createCustomer = async() => {
    const response = await axios.post('http://localhost:8080/create-customer', {
      body: {
        email: 'hassanpumped17@gmail.com'
      }
    })

    setCustomerId(response.data.customer.id);
    console.log(response.data.customer)
  }

  // customer 존재하는지 조회
  const fetchSingleCustomer = async() => {
    const response = await  axios.post('http://localhost:8080/fetch-customer', {
      id: customerId // firebase나 클라이언트 스토리지에서 관리
    })

    console.log(response.data)
  }

  // 
  const fetchPaymentMethod = async() => {
    const response = await axios.post('http://localhost:8080/retrieve-payment-method', {
      id: customerId // firebase나 클라이언트 스토리지에서 관리
    })

    console.log("paymentMethod", response.data)
  }

  // Stripe API 사용해서 클라이언트에서 사용.
  const handleCreatePaymentMethod = async() => {
    const paymentMethod = await createPaymentMethod({
      paymentMethodType: 'Card',
      paymentMethodData: {
        billingDetails: {
          email: 'hassanpumped17@gmail.com'
        }
      }
    })

    console.log("paymentMethoddddddd", paymentMethod)
    setPaymentMethodId(paymentMethod.paymentMethod?.id || '')
    console.log("paymentMethod", paymentMethod.paymentMethod?.id)

    const response = await axios.post('http://localhost:8080/attach-payment-method', {
      customer: customerId,
      paymentMethod: paymentMethod.paymentMethod?.id // 위에 객체에서 얻은 아이디
    });

    console.log("response", response.data)
  }

  const handleDetachPaymentMethod = async() => {
    const response = await axios.post('http://localhost:8080/detach-payment-method', {
      paymentMethodId: paymentMethodId
    })

    console.log(response.data)
  }


  return (
    <StripeProvider
      publishableKey={stripePublishableKey}
      urlScheme='stripeclient://stripe'
    >
      <View style={styles.container}>
        <Button title='createCustomer' onPress={() => createCustomer()}/>
        <Button title='getSingleCustomer' onPress={() => fetchSingleCustomer()}/>
        <Button title='retrievePaymentMethod' onPress={() => fetchPaymentMethod()}/>
        <Button title='createPaymentMethod' onPress={async () => handleCreatePaymentMethod()}/>
        <Button title='deletePaymentMethod' onPress={async () => handleDetachPaymentMethod()}/>
        <CardField
          autofocus
          cardStyle={{
            borderWidth: 1,
            borderRadius: 20,
          }}
          onCardChange={(card) => {
            console.log("card", card)
          }}
          style={{
            width: '100%',
            height: 60,
          }}
        />
        <Button title='handlePayment' onPress={() => handlePayment()}/>
      </View>
    </StripeProvider>

  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})


