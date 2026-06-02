import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbConnection, sql } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Controller to handle user login.
 * Queries the database, verifies password (plaintext or bcrypt), and issues a JWT token.
 */
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Validate inputs
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required.' 
    });
  }

  try {
    const pool = await getDbConnection();
    
    // Parameterized query to completely prevent SQL Injection
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT [user_id], [username], [password], [role_level], [department] FROM [dbo].[users] WHERE [username] = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password.' 
      });
    }

    const user = result.recordset[0];
    const dbPassword = user.password;

    // Verify password:
    // Support plaintext check (for existing legacy database passwords)
    // and fallback to bcrypt hashing check (recommended).
    let isMatch = false;
    if (password === dbPassword) {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(password, dbPassword);
      } catch (bcryptErr) {
        // The password in the database wasn't a valid bcrypt hash, or comparison failed
        isMatch = false;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password.' 
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dashboard_super_secret_key_2026_change_me';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role_level: user.role_level,
        department: user.department
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role_level: user.role_level,
        department: user.department
      }
    });

  } catch (error: any) {
    console.error('Database query error during login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Database query failed or connection error.', 
      error: error.message 
    });
  }
};

/**
 * Controller to get current authenticated user's information.
 * Decodes details directly from the validated JWT token.
 */
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: No active session.' 
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user
  });
};
