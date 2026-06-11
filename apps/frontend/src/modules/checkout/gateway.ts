import type { GatewayRedirect } from './types';

/**
 * Send the shopper to the payment gateway. GET → location change; POST → build a
 * hidden form and submit (eSewa signed form). Gateways redirect back to the
 * backend callback, which verifies and 302s to /checkout/result.
 */
export function gatewayRedirect(redirect: GatewayRedirect): void {
  if (redirect.method === 'GET') {
    window.location.href = redirect.url;
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = redirect.url;
  for (const [key, value] of Object.entries(redirect.fields ?? {})) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
