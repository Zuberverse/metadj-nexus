/**
 * User Management
 *
 * PostgreSQL-based user storage via Drizzle ORM.
 * Uses the storage layer for database operations.
 *
 * See docs/AUTH-SYSTEM.md for architecture details.
 */

import { TERMS_VERSION } from '@/lib/constants/terms';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword, needsRehash, getHashAlgorithm } from './password';
import * as storage from '../../../server/storage';
import type { User, SessionUser, LoginCredentials, RegisterCredentials } from './types';

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Rehash password if using legacy algorithm (PBKDF2 -> Argon2id migration)
 *
 * This is called after successful password verification to transparently
 * upgrade password hashes to Argon2id on login.
 */
async function rehashIfNeeded(
  userId: string,
  password: string,
  currentHash: string
): Promise<void> {
  if (!needsRehash(currentHash)) {
    return;
  }

  try {
    const oldAlgorithm = getHashAlgorithm(currentHash);
    const newHash = await hashPassword(password);
    await storage.updateUserPassword(userId, newHash);
    logger.info('[Auth] Password hash migrated', {
      userId,
      from: oldAlgorithm,
      to: 'argon2id',
    });
  } catch (error) {
    // Log but don't fail login - hash migration is opportunistic
    logger.error('[Auth] Failed to migrate password hash', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Convert database user to auth user type
 */
function dbUserToAuthUser(user: Awaited<ReturnType<typeof storage.findUserById>>): User | null {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    passwordHash: user.passwordHash,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    termsVersion: user.termsVersion ?? null,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await storage.findUserByEmail(normalizedEmail);
  return dbUserToAuthUser(user);
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const user = await storage.findUserById(id);
  return dbUserToAuthUser(user);
}

/**
 * Authenticate a user with email/password
 */
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<SessionUser | null> {
  const { email, password } = credentials;
  const normalizedEmail = email.toLowerCase().trim();

  // Special case: admin login via "admin" username (bootstrap only)
  if (normalizedEmail === 'admin') {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      logger.warn('[Auth] ADMIN_PASSWORD not set, admin login disabled');
      return null;
    }

    // Check if an admin already exists in database
    const existingAdmin = await storage.findAdminUser();

    if (existingAdmin) {
      // Admin already exists - verify password against stored hash
      const valid = await verifyPassword(password, existingAdmin.passwordHash);
      if (!valid) {
        logger.info('[Auth] Admin login failed - invalid password');
        return null;
      }

      // Migrate hash to Argon2id if using legacy algorithm
      await rehashIfNeeded(existingAdmin.id, password, existingAdmin.passwordHash);

      return {
        id: existingAdmin.id,
        email: existingAdmin.email,
        username: existingAdmin.username,
        isAdmin: true,
        emailVerified: existingAdmin.emailVerified,
        termsVersion: existingAdmin.termsVersion,
      };
    }

    // No admin exists - this is bootstrap
    if (password === adminPassword) {
      // Create the admin user in database
      const passwordHash = await hashPassword(password);
      const newAdmin = await storage.createUser({
        id: generateUserId(),
        email: 'admin@metadj.local',
        username: 'admin',
        passwordHash,
        isAdmin: true,
        emailVerified: true,
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: new Date(),
      });

      logger.info('[Auth] Admin user bootstrapped', { userId: newAdmin.id });

      return {
        id: newAdmin.id,
        email: newAdmin.email,
        username: newAdmin.username,
        isAdmin: true,
        emailVerified: true,
        termsVersion: newAdmin.termsVersion,
      };
    }
    return null;
  }

  // Check if this is an admin alias login
  const isAlias = await storage.isAdminUsernameAlias(normalizedEmail);
  if (isAlias) {
    const admin = await storage.findAdminByAlias(normalizedEmail);
    if (admin) {
      const valid = await verifyPassword(password, admin.passwordHash);
      if (valid) {
        // Migrate hash to Argon2id if using legacy algorithm
        await rehashIfNeeded(admin.id, password, admin.passwordHash);

        logger.info('[Auth] Admin login via alias', { alias: normalizedEmail });
        return {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          isAdmin: true,
          emailVerified: admin.emailVerified,
          termsVersion: admin.termsVersion,
        };
      }
    }
    return null;
  }

  // Normal user login
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Migrate hash to Argon2id if using legacy algorithm
  await rehashIfNeeded(user.id, password, user.passwordHash);

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    termsVersion: user.termsVersion,
  };
}

/**
 * Validate username format (lowercase alphanumeric and underscores, 3-20 chars)
 */
function validateUsername(username: string): { valid: boolean; error?: string } {
  const normalized = username.toLowerCase().trim();
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (normalized.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, and underscores' };
  }
  if (/^[0-9]/.test(normalized)) {
    return { valid: false, error: 'Username cannot start with a number' };
  }
  
  return { valid: true };
}

/**
 * Check if username is reserved (cannot be used by regular users)
 * Note: Admin aliases must be checked separately via isAdminUsernameAlias
 */
function isReservedUsername(username: string): { reserved: boolean; error?: string } {
  const normalized = username.toLowerCase().trim();
  const reserved = ['root', 'system', 'metadj', 'metadjai', 'support', 'help', 'api', 'www'];
  
  if (reserved.includes(normalized)) {
    return { reserved: true, error: 'This username is reserved' };
  }
  
  return { reserved: false };
}

/**
 * Check if username is an admin alias (async check)
 */
async function checkAdminAliasReserved(username: string): Promise<{ reserved: boolean; error?: string }> {
  const normalized = username.toLowerCase().trim();
  
  if (normalized === 'admin') {
    return { reserved: true, error: 'This username is reserved' };
  }
  
  const isAlias = await storage.isAdminUsernameAlias(normalized);
  if (isAlias) {
    return { reserved: true, error: 'This username is reserved' };
  }
  
  return { reserved: false };
}

/**
 * Register a new user
 */
export async function registerUser(
  credentials: RegisterCredentials
): Promise<SessionUser | null> {
  const registrationEnabled = process.env.AUTH_REGISTRATION_ENABLED !== 'false';
  if (!registrationEnabled) {
    throw new Error('Registration is currently disabled');
  }

  const { email, username, password } = credentials;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Invalid email format');
  }

  // Validate username format
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.error);
  }

  // Check reserved usernames (includes 'admin')
  const reservedCheck = isReservedUsername(username);
  if (reservedCheck.reserved) {
    throw new Error(reservedCheck.error);
  }

  // Check admin aliases (async)
  const aliasCheck = await checkAdminAliasReserved(normalizedUsername);
  if (aliasCheck.reserved) {
    throw new Error(aliasCheck.error);
  }

  // Check password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if email already exists
  const emailAvailable = await storage.isEmailAvailable(normalizedEmail);
  if (!emailAvailable) {
    throw new Error('An account with this email already exists');
  }

  // Check if username already exists
  const usernameAvailable = await storage.isUsernameAvailable(normalizedUsername);
  if (!usernameAvailable) {
    throw new Error('This username is already taken');
  }

  // Reserved admin email
  if (normalizedEmail === 'admin') {
    throw new Error('This email cannot be used for registration');
  }

  const passwordHash = await hashPassword(password);

  const newUser = await storage.createUser({
    id: generateUserId(),
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
    isAdmin: false,
    emailVerified: false,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: new Date(),
  });

  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    isAdmin: newUser.isAdmin,
    emailVerified: newUser.emailVerified,
    termsVersion: newUser.termsVersion,
  };
}

/**
 * Update user email
 */
export async function updateUserEmail(
  userId: string,
  newEmail: string
): Promise<SessionUser | null> {
  const normalizedEmail = newEmail.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Invalid email format');
  }

  // Prevent changing to reserved 'admin' email
  if (normalizedEmail === 'admin') {
    throw new Error('This email cannot be used');
  }

  // Check if email is already taken by another user
  const emailAvailable = await storage.isEmailAvailable(normalizedEmail, userId);
  if (!emailAvailable) {
    throw new Error('This email is already in use');
  }

  const updated = await storage.updateUserEmail(userId, normalizedEmail);
  if (!updated) {
    throw new Error('User not found');
  }

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    isAdmin: updated.isAdmin,
    emailVerified: updated.emailVerified,
    termsVersion: updated.termsVersion ?? null,
  };
}

/**
 * Update user username
 * For admin users: adds username as an alias instead of replacing
 * For regular users: replaces the username
 */
export async function updateUserUsername(
  userId: string,
  newUsername: string
): Promise<SessionUser | null> {
  const normalizedUsername = newUsername.toLowerCase().trim();
  
  // Validate username format
  const validation = validateUsername(newUsername);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check reserved usernames
  const reservedCheck = isReservedUsername(newUsername);
  if (reservedCheck.reserved) {
    throw new Error(reservedCheck.error);
  }

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  // For admin users: add as alias instead of replacing
  if (currentUser.isAdmin) {
    // Check if this is the same as their primary username
    if (normalizedUsername === currentUser.username) {
      throw new Error('This is already your primary username');
    }
    
    // Check if already an alias
    const isExistingAlias = await storage.isAdminUsernameAlias(normalizedUsername);
    if (isExistingAlias && normalizedUsername !== 'admin') {
      throw new Error('This alias already exists');
    }
    
    // Check if username is taken by another user
    const usernameAvailable = await storage.isUsernameAvailable(normalizedUsername, userId);
    if (!usernameAvailable) {
      throw new Error('This username is already taken by another user');
    }
    
    // Add as alias
    const updated = await storage.addUsernameAlias(userId, normalizedUsername);
    if (!updated) {
      throw new Error('Failed to add username alias');
    }
    
    logger.info('[Auth] Admin username alias added', { userId, alias: normalizedUsername });
    
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      isAdmin: updated.isAdmin,
      emailVerified: updated.emailVerified,
      termsVersion: updated.termsVersion ?? null,
    };
  }

  // For regular users: check admin aliases are not taken
  const aliasCheck = await checkAdminAliasReserved(normalizedUsername);
  if (aliasCheck.reserved) {
    throw new Error(aliasCheck.error);
  }

  // Check if username is already taken
  const usernameAvailable = await storage.isUsernameAvailable(normalizedUsername, userId);
  if (!usernameAvailable) {
    throw new Error('This username is already taken');
  }

  const updated = await storage.updateUserUsername(userId, normalizedUsername);
  if (!updated) {
    throw new Error('User not found');
  }

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    isAdmin: updated.isAdmin,
    emailVerified: updated.emailVerified,
    termsVersion: updated.termsVersion ?? null,
  };
}

/**
 * Check username availability
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string }> {
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }
  
  // Check reserved usernames
  const reservedCheck = isReservedUsername(username);
  if (reservedCheck.reserved) {
    return { available: false, error: reservedCheck.error };
  }
  
  // Check admin aliases (includes 'admin')
  const aliasCheck = await checkAdminAliasReserved(username);
  if (aliasCheck.reserved) {
    return { available: false, error: aliasCheck.error };
  }
  
  const available = await storage.isUsernameAvailable(username.toLowerCase().trim(), excludeUserId);
  return { available };
}

/**
 * Check email availability
 */
export async function checkEmailAvailability(
  email: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(normalizedEmail)) {
    return { available: false, error: 'Invalid email format' };
  }
  
  if (normalizedEmail === 'admin') {
    return { available: false, error: 'This email cannot be used' };
  }
  
  const available = await storage.isEmailAvailable(normalizedEmail, excludeUserId);
  return { available };
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Current password is incorrect');
  }

  // Update password
  const newPasswordHash = await hashPassword(newPassword);
  const updated = await storage.updateUserPassword(userId, newPasswordHash);
  
  return !!updated;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const users = await storage.getAllUsers();
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    termsVersion: user.termsVersion ?? null,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  return storage.getUserCount();
}

/**
 * Update user terms acceptance
 */
export async function updateUserTerms(
  userId: string,
  termsVersion: string
): Promise<SessionUser | null> {
  const updated = await storage.updateUserTerms(userId, termsVersion);
  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    isAdmin: updated.isAdmin,
    emailVerified: updated.emailVerified,
    termsVersion: updated.termsVersion ?? null,
  };
}
