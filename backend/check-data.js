/**
 * @file: check-data.js
 * @description: Скрипт для проверки данных в базе
 * @dependencies: @prisma/client
 * @created: 2024-12-19
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('Проверяем данные в базе...');

        // Проверяем школы
        const schools = await prisma.school.findMany();
        console.log('Школы:', schools);

        // Проверяем классы
        const classes = await prisma.class.findMany();
        console.log('Классы:', classes);

        // Проверяем мастер-классы
        const workshops = await prisma.workshop.findMany({
            include: {
                school: true,
                class: true,
                service: true
            }
        });
        console.log('Мастер-классы:', workshops.map(w => ({
            id: w.id,
            school: w.school?.name,
            class: w.class?.name,
            service: w.service?.name,
            date: w.date,
            status: w.status
        })));

        // Проверяем пользователей
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                school: true,
                grade: true,
                shift: true
            }
        });
        console.log('Пользователи:', users);

    } catch (error) {
        console.error('Ошибка проверки данных:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData(); 