#!/usr/bin/env node

/**
 * Initialize leave balances for existing employees
 * Run this once to fix existing employees without leave balances
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
        console.log('🔧 Initializing Leave Balances for Existing Employees\n');

        try {
                // Get all active employees
                const employees = await prisma.user.findMany({
                        where: {
                                role: 'EMPLOYEE',
                                isActive: true,
                        },
                        select: {
                                id: true,
                                name: true,
                                email: true,
                        },
                });

                console.log(`Found ${employees.length} active employees\n`);

                const currentYear = new Date().getFullYear();
                const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave'];
                let initialized = 0;
                let skipped = 0;

                for (const employee of employees) {
                        console.log(`Processing: ${employee.name} (${employee.email})`);

                        for (const type of leaveTypes) {
                                // Check if balance already exists
                                const existing = await prisma.leaveBalance.findUnique({
                                        where: {
                                                userId_type: {
                                                        userId: employee.id,
                                                        type: type,
                                                },
                                        },
                                });

                                if (existing) {
                                        console.log(`  ⏭️  ${type}: Already exists`);
                                        skipped++;
                                } else {
                                        await prisma.leaveBalance.create({
                                                data: {
                                                        userId: employee.id,
                                                        type: type,
                                                        total: 20,
                                                        used: 0,
                                                        year: currentYear,
                                                },
                                        });
                                        console.log(`  ✅ ${type}: Initialized (20 days)`);
                                        initialized++;
                                }
                        }
                        console.log('');
                }

                console.log('═══════════════════════════════════');
                console.log(`✨ Initialization Complete!`);
                console.log(`   Created: ${initialized} leave balances`);
                console.log(`   Skipped: ${skipped} (already existed)`);
                console.log('═══════════════════════════════════\n');

        } catch (error) {
                console.error('❌ Error:', error.message);
                process.exit(1);
        } finally {
                await prisma.$disconnect();
        }
}

main();
