const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestAdmin() {
    try {
        const hashedPassword = bcrypt.hashSync('password', 10);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: {
                password: hashedPassword,
                role: 'admin',
                firstName: 'Тестовый',
                lastName: 'Администратор'
            },
            create: {
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin',
                firstName: 'Тестовый',
                lastName: 'Администратор'
            }
        });

        console.log('Тестовый администратор создан/обновлен:', admin);
    } catch (error) {
        console.error('Ошибка создания администратора:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAdmin(); 