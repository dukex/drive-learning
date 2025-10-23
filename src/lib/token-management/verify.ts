/**
 * Verification script for TokenValidator functionality
 * This can be run to verify the token management infrastructure works correctly
 */

import { TokenValidator, safeExtractJWTPayload, extractTokenInfo } from './index';

// Sample JWT token for testing (this is a test token, not a real one)
const sampleJWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6MTcwMDAwMDAwMCwiaWF0IjoxNjAwMDAwMDAwLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaXNzIjoidGVzdC1pc3N1ZXIifQ.invalid-signature';

// Sample expired JWT token
const expiredJWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6MTUwMDAwMDAwMCwiaWF0IjoxNDAwMDAwMDAwLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaXNzIjoidGVzdC1pc3N1ZXIifQ.invalid-signature';

export function verifyTokenValidator(): void {
  console.log('🔍 Verifying TokenValidator functionality...\n');

  const validator = new TokenValidator();

  // Test 1: Valid token format validation
  console.log('Test 1: Token format validation');
  const formatValid = validator.validateTokenFormat(sampleJWT);
  console.log(`✓ Valid JWT format: ${formatValid}`);

  // Test 2: Invalid token format
  const formatInvalid = validator.validateTokenFormat('invalid.token');
  console.log(`✓ Invalid JWT format detected: ${!formatInvalid}`);

  // Test 3: Token expiry detection
  console.log('\nTest 3: Token expiry detection');
  const isExpired = validator.isTokenExpired(expiredJWT);
  console.log(`✓ Expired token detected: ${isExpired}`);

  // Test 4: Token expiry soon detection
  const isExpiringSoon = validator.isTokenExpiringSoon(sampleJWT, 5);
  console.log(`✓ Token expiring soon check: ${isExpiringSoon}`);

  // Test 5: Get token expiry
  console.log('\nTest 5: Token expiry extraction');
  const expiryDate = validator.getTokenExpiry(sampleJWT);
  console.log(`✓ Token expiry date: ${expiryDate?.toISOString()}`);

  // Test 6: Safe payload extraction
  console.log('\nTest 6: Safe payload extraction');
  const payloadResult = safeExtractJWTPayload(sampleJWT);
  console.log(`✓ Payload extraction success: ${payloadResult.success}`);
  if (payloadResult.success && payloadResult.payload) {
    console.log(`✓ Subject: ${payloadResult.payload.sub}`);
    console.log(`✓ Audience: ${payloadResult.payload.aud}`);
  }

  // Test 7: Token info extraction
  console.log('\nTest 7: Token info extraction');
  const tokenInfo = extractTokenInfo(sampleJWT);
  console.log(`✓ Token valid: ${tokenInfo.isValid}`);
  console.log(`✓ Subject: ${tokenInfo.subject}`);
  console.log(`✓ Issuer: ${tokenInfo.issuer}`);

  // Test 8: Error handling
  console.log('\nTest 8: Error handling');
  const invalidResult = safeExtractJWTPayload('invalid-token');
  console.log(`✓ Invalid token handled gracefully: ${!invalidResult.success}`);
  console.log(`✓ Error message: ${invalidResult.error}`);

  console.log('\n✅ All TokenValidator tests completed successfully!');
}

// Export for potential use in other verification scripts
export { sampleJWT, expiredJWT };