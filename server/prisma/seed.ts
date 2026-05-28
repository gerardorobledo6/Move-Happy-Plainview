import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@movehappy.com' },
        update: {},
        create: {
            email: 'admin@movehappy.com',
            name: 'Admin User',
            passwordHash: passwordHash,
            role: 'ADMIN',
            avatarColor: '#ea580c'
        },
    });

    const user1 = await prisma.user.upsert({
        where: { email: 'john@movehappy.com' },
        update: {},
        create: {
            email: 'john@movehappy.com',
            name: 'John Doe',
            passwordHash: passwordHash,
            role: 'USER',
            avatarColor: '#2563eb'
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jane@movehappy.com' },
        update: {},
        create: {
            email: 'jane@movehappy.com',
            name: 'Jane Smith',
            passwordHash: passwordHash,
            role: 'USER',
            avatarColor: '#db2777'
        },
    });

    // Lanes
    const laneTitles = [
        'Welcome', 'Prep', 'Premove', 'PU live', 'fu1', 'fu2', 'fu3',
        'LC', 'Del live', 'With claim', 'Finished'
    ];

    for (let i = 0; i < laneTitles.length; i++) {
        await prisma.lane.upsert({
            where: { id: `lane-${i}` }, // Using deterministic ID for upsert if possible, or just create
            update: {},
            create: {
                id: `lane-${i}`, // Optional: let uuid generate if mapping not needed, but index is good for order
                title: laneTitles[i],
                order: i
            }
        });
    }

    // Cards
    // We need to fetch lanes to get their real IDs if we didn't force them suitable for UUIDs.
    // Actually, we can use findFirst to get lanes.
    const welcomeLane = await prisma.lane.findFirst({ where: { title: 'Welcome' } });
    const prepLane = await prisma.lane.findFirst({ where: { title: 'Prep' } });

    if (welcomeLane) {
        await prisma.card.create({
            data: {
                title: 'Client A - New Inquiry',
                headerId: 'CL-101',
                description: '<p>Standard inquiry for services.</p>',
                priority: 'Normal',
                status: 'Active',
                laneId: welcomeLane.id,
                plannedStart: new Date(),
                assignedUsers: { connect: [{ id: admin.id }] }
            }
        });
        await prisma.card.create({
            data: {
                title: 'Client B - Urgent Request',
                headerId: 'CL-102',
                description: '<p>Need immediate assistance.</p>',
                priority: 'Urgent',
                status: 'Active',
                laneId: welcomeLane.id,
                plannedFinish: new Date(Date.now() + 86400000),
                assignedUsers: { connect: [{ id: user2.id }] }
            }
        });
    }

    if (prepLane) {
        await prisma.card.create({
            data: {
                title: 'Client C - Documentation',
                headerId: 'CL-103',
                description: 'Waiting for docs.',
                priority: 'Low',
                status: 'Blocked',
                laneId: prepLane.id,
                assignedUsers: { connect: [{ id: user1.id }] }
            }
        });
    }

    console.log('Seed data created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
