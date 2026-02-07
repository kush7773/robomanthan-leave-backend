#!/usr/bin/env node

/**
 * Test script for API Testing
 * Creates both EMPLOYEE and EMPLOYER test users
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
        console.log('🧪 API Test User Setup\n');

        const testPassword = 'Test@123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        try {
                // 1. Create EMPLOYEE test user
                console.log('1️⃣  Creating/updating EMPLOYEE test user...');
                const employee = await prisma.user.upsert({
                        where: { email: 'test-employee@robomanthan.com' },
                        update: {
                                password: hashedPassword,
                                isActive: true,
                        },
                        create: {
                                email: 'test-employee@robomanthan.com',
                                name: 'Test Employee',
                                password: hashedPassword,
                                role: 'EMPLOYEE',
                                phone: '+1234567890',
                                jobRole: 'Software Engineer',
                                isActive: true,
                        },
                });
                console.log(`✅ Employee user ready: ${employee.email}`);

                // 2. Create EMPLOYER test user
                console.log('2️⃣  Creating/updating EMPLOYER test user...');
                const employer = await prisma.user.upsert({
                        where: { email: 'test-employer@robomanthan.com' },
                        update: {
                                password: hashedPassword,
                                isActive: true,
                        },
                        create: {
                                email: 'test-employer@robomanthan.com',
                                name: 'Test Employer',
                                password: hashedPassword,
                                role: 'EMPLOYER',
                                phone: '+9876543210',
                                jobRole: 'HR Manager',
                                isActive: true,
                        },
                });
                console.log(`✅ Employer user ready: ${employer.email}\n`);

                // 3. Print credentials
                console.log('📋 Test Credentials:');
                console.log('\n👤 EMPLOYEE User:');
                console.log('   Email: test-employee@robomanthan.com');
                console.log('   Password: Test@123');
                console.log('   Role: EMPLOYEE');

                console.log('\n👔 EMPLOYER User:');
                console.log('   Email: test-employer@robomanthan.com');
                console.log('   Password: Test@123');
                console.log('   Role: EMPLOYER\n');

                // 4. Print test commands
                console.log('🚀 Quick Test Commands:\n');

                console.log('# Login as EMPLOYEE');
                console.log('curl -X POST http://localhost:4000/auth/login \\');
                console.log('  -H "Content-Type: application/json" \\');
                console.log('  -d \'{"email":"test-employee@robomanthan.com","password":"Test@123"}\'\n');

                console.log('# Login as EMPLOYER');
                console.log('curl -X POST http://localhost:4000/auth/login \\');
                console.log('  -H "Content-Type: application/json" \\');
                console.log('  -d \'{"email":"test-employer@robomanthan.com","password":"Test@123"}\'\n');

                console.log('✨ Test users created successfully!');
                console.log('💡 Run ./test-all-apis.sh for comprehensive API testing.\n');

        } catch (error) {
                console.error('❌ Error:', error.message);
                process.exit(1);
        } finally {
                await prisma.$disconnect();
        }
}

main();
