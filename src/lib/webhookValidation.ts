/**
 * Webhook URL validation utility
 * Prevents SSRF attacks and ensures only safe webhook URLs are accepted
 */

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

// Private IP ranges that should be blocked
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // Loopback
  /^10\./,                           // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./,   // Private Class B  
  /^192\.168\./,                     // Private Class C
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^224\./,                          // Multicast
  /^255\./,                          // Broadcast
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '[::1]',
  'metadata.google.internal',
  'metadata.google.com',
];

/**
 * Validates a webhook URL for security
 * - Only allows HTTPS protocol
 * - Blocks private IP ranges (SSRF prevention)
 * - Blocks localhost and internal hostnames
 * - Blocks credentials in URL
 */
export function validateWebhookUrl(url: string): WebhookValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL é obrigatória' };
  }

  try {
    const parsed = new URL(url);

    // Only allow HTTPS (security requirement)
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Apenas URLs HTTPS são permitidas' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block known dangerous hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, error: 'Hostname não permitido' };
    }

    // Block private IP ranges (SSRF prevention)
    if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'IPs privados não são permitidos' };
    }

    // Block cloud metadata endpoints
    if (hostname.includes('169.254') || hostname.includes('metadata')) {
      return { valid: false, error: 'Endpoints de metadata não são permitidos' };
    }

    // Block credentials in URL
    if (parsed.username || parsed.password) {
      return { valid: false, error: 'URLs com credenciais não são permitidas' };
    }

    // Block file:// and other dangerous protocols (extra check)
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Protocolo não permitido' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Formato de URL inválido' };
  }
}

/**
 * Zod refinement function for webhook URL validation
 */
export function isValidWebhookUrl(url: string): boolean {
  return validateWebhookUrl(url).valid;
}

/**
 * Get validation error message for webhook URL
 */
export function getWebhookValidationError(url: string): string {
  const result = validateWebhookUrl(url);
  return result.error || 'URL inválida';
}
