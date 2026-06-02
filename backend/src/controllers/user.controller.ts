import { Request, Response } from 'express';
import { getDbConnection, sql } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Controller to retrieve all users from the database.
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request()
      .query('SELECT [user_id], [username], [password], [role_level], [department] FROM [dbo].[users] ORDER BY [user_id] DESC');
    
    return res.status(200).json({
      success: true,
      users: result.recordset
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve users list.', 
      error: error.message 
    });
  }
};

/**
 * Controller to create a new user inside the SQL Server users table.
 */
export const createUser = async (req: Request, res: Response) => {
  const { username, password, role_level, department } = req.body;

  if (!username || !password || !role_level || !department) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields (username, password, role_level, department) are required.' 
    });
  }

  try {
    const pool = await getDbConnection();

    // Check if username already exists
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT 1 FROM [dbo].[users] WHERE [username] = @username');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is already taken.' 
      });
    }

    // Insert user
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password) // stores plaintext or bcrypt hash
      .input('role_level', sql.NVarChar, role_level)
      .input('department', sql.NVarChar, department)
      .query('INSERT INTO [dbo].[users] ([username], [password], [role_level], [department]) VALUES (@username, @password, @role_level, @department)');

    return res.status(201).json({
      success: true,
      message: 'User created successfully.'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create user.', 
      error: error.message 
    });
  }
};

/**
 * Controller to update an existing user's details.
 */
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, role_level, department } = req.body;

  if (!username || !role_level || !department) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, role_level, and department are required.' 
    });
  }

  try {
    const pool = await getDbConnection();

    // Check if user exists
    const checkUser = await pool.request()
      .input('id', sql.Int, Number(id))
      .query('SELECT [password] FROM [dbo].[users] WHERE [user_id] = @id');

    if (checkUser.recordset.length === 0) {
      return res.status(444).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    const currentPassword = checkUser.recordset[0].password;
    // If a new password is provided, use it. Otherwise, keep the existing password.
    const finalPassword = password && password.trim() !== '' ? password : currentPassword;

    await pool.request()
      .input('id', sql.Int, Number(id))
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, finalPassword)
      .input('role_level', sql.NVarChar, role_level)
      .input('department', sql.NVarChar, department)
      .query('UPDATE [dbo].[users] SET [username] = @username, [password] = @password, [role_level] = @role_level, [department] = @department WHERE [user_id] = @id');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update user.', 
      error: error.message 
    });
  }
};

/**
 * Controller to delete a user. Prevents self-deletion.
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  // Prevent self-deletion for security
  if (req.user.user_id === Number(id)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Security Alert: You cannot delete your own administrator account!' 
    });
  }

  try {
    const pool = await getDbConnection();
    
    await pool.request()
      .input('id', sql.Int, Number(id))
      .query('DELETE FROM [dbo].[users] WHERE [user_id] = @id');

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user.', 
      error: error.message 
    });
  }
};
