import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Retrieve the user ID from the client_reference_id
    const userId = session.client_reference_id

    if (userId) {
      // Update the user's subscription status to 'premium'
      await updateUserSubscription(userId, 'premium')
      console.log(`Updated subscription for user ${userId} to premium`)
    } else {
      console.error('No userId found in the session')
    }
  }

  return NextResponse.json({ received: true })
}

// update user's subscription status
async function updateUserSubscription(userId, status) {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    subscription: status,
  })
}