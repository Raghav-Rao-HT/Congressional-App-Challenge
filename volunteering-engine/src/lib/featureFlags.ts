/**
 * Block the whole app until the user has verified their email.
 *
 * Off by default so deploying this build cannot lock out existing accounts (including demo/test
 * accounts whose addresses can't receive mail). Turn it on together with `enforceEmailVerification()`
 * in firestore.rules -- see SECURITY.md for the rollout order.
 */
export const REQUIRE_VERIFIED_EMAIL = import.meta.env.VITE_REQUIRE_VERIFIED_EMAIL === 'true'
