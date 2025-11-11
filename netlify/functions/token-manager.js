/**
 * Netlify Function: Token Manager
 * Handles user token/credit management for AI generation
 * 
 * WARNING: This implementation uses in-memory storage which will reset on every 
 * function cold start or restart. This is NOT suitable for production.
 * For production use, implement persistent storage using:
 * - FaunaDB (recommended for Netlify)
 * - Supabase
 * - Firebase
 * - PostgreSQL
 */

// In-memory storage for demo (replace with database in production)
// WARNING: Data will be lost on function restart/cold start
const userTokens = new Map();

// *** RUNTIME WARNING: In-memory storage will lose all user token data on function cold starts! ***
console.warn('[Token Manager] WARNING: Using in-memory storage for user tokens. All data will be lost on function cold start or restart. THIS IS NOT SUITABLE FOR PRODUCTION. Please implement persistent storage (e.g., FaunaDB, Supabase, Firebase, PostgreSQL).');
// Default token allocation for new users
const DEFAULT_TOKENS = 100;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, userId, cost } = JSON.parse(event.body);

    // Validate required parameters
    if (!action || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: action, userId' })
      };
    }

    // Initialize user if not exists
    if (!userTokens.has(userId)) {
      userTokens.set(userId, {
        balance: DEFAULT_TOKENS,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        transactions: []
      });
    }

    const userAccount = userTokens.get(userId);

    // Handle different actions
    switch (action) {
      case 'check':
        // Check if user has sufficient tokens
        const sufficient = userAccount.balance >= (cost || 0);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            sufficient,
            balance: userAccount.balance,
            required: cost || 0
          })
        };

      case 'deduct':
        // Deduct tokens from user account
        if (!cost || cost < 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid cost amount' })
          };
        }

        if (userAccount.balance < cost) {
          return {
            statusCode: 402,
            body: JSON.stringify({ 
              error: 'Insufficient tokens',
              balance: userAccount.balance,
              required: cost
            })
          };
        }

        userAccount.balance -= cost;
        userAccount.lastUpdated = new Date().toISOString();
        userAccount.transactions.push({
          type: 'deduct',
          amount: cost,
          timestamp: new Date().toISOString(),
          balanceAfter: userAccount.balance
        });

        userTokens.set(userId, userAccount);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            balance: userAccount.balance,
            deducted: cost
          })
        };

      case 'add':
        // Add tokens to user account (for purchases)
        const amount = cost || 0;
        if (amount <= 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid amount' })
          };
        }

        userAccount.balance += amount;
        userAccount.lastUpdated = new Date().toISOString();
        userAccount.transactions.push({
          type: 'add',
          amount: amount,
          timestamp: new Date().toISOString(),
          balanceAfter: userAccount.balance
        });

        userTokens.set(userId, userAccount);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            balance: userAccount.balance,
            added: amount
          })
        };

      case 'balance':
        // Get current balance
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            balance: userAccount.balance,
            transactions: userAccount.transactions.slice(-10) // Last 10 transactions
          })
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action. Use: check, deduct, add, or balance' })
        };
    }

  } catch (error) {
    console.error('Error in token-manager:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage tokens', details: error.message })
    };
  }
};
