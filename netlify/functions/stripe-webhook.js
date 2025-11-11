/**
 * Netlify Function: Stripe Webhook Handler
 * Handles Stripe payment webhooks for token purchases
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        // Payment successful - add tokens to user account
        const session = stripeEvent.data.object;
        
        // Extract user ID and token amount from metadata
        const userId = session.metadata?.userId;
        const tokenAmount = parseInt(session.metadata?.tokenAmount) || 0;

        if (!userId || !tokenAmount) {
          console.error('Missing userId or tokenAmount in session metadata');
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing metadata' })
          };
        }

        // Add tokens to user account via token-manager
        const addTokensResponse = await fetch(
          `${process.env.URL}/.netlify/functions/token-manager`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add',
              userId: userId,
              cost: tokenAmount
            })
          }
        );

        const tokenResult = await addTokensResponse.json();

        if (!tokenResult.success) {
          throw new Error('Failed to add tokens to user account');
        }

        console.log(`Successfully added ${tokenAmount} tokens to user ${userId}`);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = stripeEvent.data.object;
        console.error('Payment failed:', failedPayment.id);
        // TODO: Send notification to user about failed payment
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle subscription events for recurring token packages
        const subscription = stripeEvent.data.object;
        console.log('Subscription event:', subscription.id);
        // TODO: Handle subscription-based token allocation
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const canceledSub = stripeEvent.data.object;
        console.log('Subscription canceled:', canceledSub.id);
        // TODO: Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed', details: error.message })
    };
  }
};
