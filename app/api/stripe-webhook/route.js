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

async function updateUserSubscription(userId, status) {
  const userRef = doc(db, 'users', userId)
  
  try {
    const userDoc = await getDoc(userRef)
    if (userDoc.exists()) {
      const userData = userDoc.data()
      const currentRooms = userData.rooms || []
      
      await updateDoc(userRef, {
        subscription: status,
        maxRooms: status === 'premium' ? 10 : 2,
        rooms: currentRooms.slice(0, status === 'premium' ? 10 : 2) // Limit rooms based on subscription
      })
      
      console.log(`Updated subscription for user ${userId} to ${status}`)
    } else {
      console.error(`User document not found for userId: ${userId}`)
    }
  } catch (error) {
    console.error(`Error updating user subscription: ${error}`)
  }
}