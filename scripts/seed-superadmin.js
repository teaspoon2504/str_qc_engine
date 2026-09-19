import { query } from '../services/shared/db.js';
import { hashPassword } from '../services/shared/auth.js';

async function seedSuperAdmin() {
  const username = 'superadmin';
  const plainPassword = 'password';
  const fullName = 'Super Administrator AML';
  const role = 'SUPER_ADMIN';
  const email = 'superadmin@bank.example.com';

  const passwordHash = hashPassword(plainPassword);

  const res = await query(
    `INSERT INTO users (username, full_name, role, email, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username) DO UPDATE
     SET password_hash = $5, role = $3, full_name = $2, email = $4
     RETURNING id, username, full_name, role, email;`,
    [username, fullName, role, email, passwordHash]
  );

  console.log('Super Admin user seeded successfully:', res.rows[0]);
  process.exit(0);
}

seedSuperAdmin().catch(err => {
  console.error('Error seeding superadmin:', err);
  process.exit(1);
});
