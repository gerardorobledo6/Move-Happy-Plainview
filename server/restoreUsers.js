const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Restoring missing users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@movehappy.com' },
        update: { passwordHash, role: 'ADMIN' },
        create: {
            email: 'admin@movehappy.com',
            name: 'MoveHappy Admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            avatarColor: '#ea580c'
        },
    });

    const edward = await prisma.user.upsert({
        where: { email: 'edward@movehappy.com' },
        update: { passwordHash, role: 'USER' },
        create: {
            email: 'edward@movehappy.com',
            name: 'Edward',
            passwordHash: passwordHash,
            role: 'USER',
            avatarColor: '#2563eb'
        },
    });

    console.log(`Restored users: ${admin.email}, ${edward.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
