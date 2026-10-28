import { profiles } from "./profiles";

/**
 * Re-export `profiles` as `users` for social and relational schema definitions.
 * Caloria profiles table holds all user profile records 1-to-1 with auth users.
 */
export const users = profiles;
export { profiles };
