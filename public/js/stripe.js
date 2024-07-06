/* eslint-disable */
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51Oj6KAC9kU4OnJSPQ4o8U2gFH8hVXWALg6M2gi2NJZTvggqMEZMew2p6Lk4KnJTZ94mRPJKlcWIIlKMpCJwRhFso00qgb65gIW',
  );
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Redirect to checkout screen by Stripe 'NOt working'
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
