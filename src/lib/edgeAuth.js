// Edge-compatible JWT decoding for proxy redirects.
// The cryptographic signature is STRICTLY verified by the Node.js API routes (apiHelpers.js).
// Here we just decode the token to check expiration for UI redirects.

export async function verifyTokenEdge(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadB64 = parts[1];
    let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const payload = JSON.parse(jsonStr);
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('Edge JWT Decode Error:', err);
    return null;
  }
}
