#!/usr/bin/env node

/**
 * Clean up ALL incorrect leave types and show what exists
 * Keeps only: Sick, Casual, Paid (title case)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
        console.log('🔍 Checking all leave types in database...\n');

        try {
                // Get all unique leave types
                const allTypes = await prisma.leaveBalance.groupBy({
                        by: ['type'],
                        _count: {
                                type: true,
                        },
                });

                console.log('📊 Current leave types in database:');
                allTypes.forEach(item => {
                        console.log(`   - "${item.type}": ${item._count.type} records`);
                });
                console.log('');

                // Define correct types
                const correctTypes = ['Sick', 'Casual', 'Paid'];

                // Find incorrect types
                const incorrectTypes = allTypes
                        .map(item => item.type)
                        .filter(type => !correctTypes.includes(type));

                if (incorrectTypes.length === 0) {
                        console.log('✅ All leave types are correct! No cleanup needed.\n');
                        return;
                }

                console.log('❌ Incorrect leave types found:', incorrectTypes);
                console.log('✅ Correct leave types:', correctTypes);
                console.log('');

                // Delete incorrect types
                const result = await prisma.leaveBalance.deleteMany({
                        where: {
                                type: {
                                        in: incorrectTypes,
                                },
                        },
                });

                console.log(`🗑️  Deleted ${result.count} incorrect leave balance records\n`);

                // Show final state
                const finalTypes = await prisma.leaveBalance.groupBy({
                        by: ['type'],
                        _count: {
                                type: true,
                        },
                });

                console.log('📊 Final leave types in database:');
                if (finalTypes.length === 0) {
                        console.log('   (none - all employees will need leave balances initialized)');
                } else {
                        finalTypes.forEach(item => {
                                console.log(`   - "${item.type}": ${item._count.type} records`);
                        });
                }

                console.log('\n✨ Cleanup complete!\n');

        } catch (error) {
                console.error('❌ Error:', error.message);
                process.exit(1);
        } finally {
                await prisma.$disconnect();
        }
}

main();
