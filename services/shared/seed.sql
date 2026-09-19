-- Initial Seed Data for AML STR Quality Control System

INSERT INTO users (username, full_name, role, email)
VALUES 
    ('ahmad.fauzi', 'Ahmad Fauzi (Junior AML Analyst)', 'ANALYST', 'ahmad.fauzi@bank.example.com'),
    ('budi.santoso', 'Budi Santoso (Senior AML QC Specialist)', 'ADMIN', 'budi.santoso@bank.example.com')
ON CONFLICT (username) DO NOTHING;
