// Customers signed up at an exhibition with only a WhatsApp number hold a
// placeholder email (server/utils/exhibitionSignup.js). It can't receive mail
// and means nothing to them, so treat it as "no email" wherever it would be
// shown or used.
const PLACEHOLDER_EMAIL = /@exhibition\.invalid$/i;

export const contactEmail = (email) => (email && !PLACEHOLDER_EMAIL.test(email) ? email : '');
