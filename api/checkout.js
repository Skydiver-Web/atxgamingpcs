const Stripe = require('stripe');

// Products map — keep prices in cents
const PRODUCTS = {
  longhorn: {
    name: 'The Longhorn — Entry Gaming PC',
    description: 'AMD Ryzen 5 9600X · RTX 4060 Ti 16GB · 16GB DDR5-5600 · 1TB NVMe · Free Austin Delivery',
    amount: 114900, // $1,149.00
    images: ['https://atxgamingpcs.com/og-image.jpg'],
  },
  capitol: {
    name: 'The Capitol — Mid-Range Gaming PC',
    description: 'AMD Ryzen 7 9800X3D · RTX 4070 Ti Super 16GB · 32GB DDR5-6000 · 2TB NVMe · Free Austin Delivery',
    amount: 219900, // $2,199.00
    images: ['https://atxgamingpcs.com/og-image.jpg'],
  },
  f1: {
    name: 'The F1 — High-End Gaming PC',
    description: 'AMD Ryzen 9 9950X · RTX 4090 24GB · 64GB DDR5-6400 · 2TB PCIe 5.0 NVMe ×2 · Free Austin Delivery',
    amount: 429900, // $4,299.00
    images: ['https://atxgamingpcs.com/og-image.jpg'],
  },
};

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://atxgamingpcs.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { productId, customerEmail, deliveryZip, customTotal, customParts } = req.body || {};

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured yet.' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const origin = req.headers.origin || 'https://atxgamingpcs.com';
    let lineItems;
    let metadata = { deliveryZip: deliveryZip || 'not provided' };

    if (productId && PRODUCTS[productId]) {
      const product = PRODUCTS[productId];
      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.images,
          },
          unit_amount: product.amount,
        },
        quantity: 1,
      }];
      metadata.product = productId;
    } else if (productId === 'custom' && customTotal) {
      // Custom build — charge whatever the builder totaled
      const amount = Math.round(parseFloat(customTotal) * 100);
      if (isNaN(amount) || amount < 9900) {
        return res.status(400).json({ error: 'Invalid custom build total.' });
      }
      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Custom Gaming PC Build — ATX Gaming PCs',
            description: customParts
              ? customParts.slice(0, 500)
              : 'Custom part-picker build. See order notes for full spec list.',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }];
      metadata.product = 'custom';
      metadata.parts = (customParts || '').slice(0, 500);
    } else {
      return res.status(400).json({ error: 'Invalid product.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail || undefined,
      metadata,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      custom_text: {
        submit: { message: 'We'll reach out within a few hours to confirm your delivery window in Austin, TX.' },
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/prebuilt.html?cancelled=1`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
};
